import { ref, readonly } from 'vue'
import { useNotificationLogger } from './useNotificationLogger'

/**
 * エラーカテゴリ
 */
export type ErrorCategory = 'network' | 'permission' | 'configuration' | 'storage' | 'unknown'

/**
 * エラー重要度
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * エラー分類結果
 */
export interface ErrorClassification {
  category: ErrorCategory
  severity: ErrorSeverity
  recoverable: boolean
  description: string
}

/**
 * ユーザーフレンドリーなエラーメッセージ
 */
export interface UserFriendlyErrorMessage {
  title: string
  description: string
  actions: string[]
}

/**
 * 回復オプション
 */
export interface RecoveryOption {
  label: string
  action: () => Promise<boolean> | boolean
  priority: number
}

/**
 * エラー統計
 */
export interface ErrorStats {
  totalErrors: number
  errorsByCategory: Record<ErrorCategory, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  lastErrorTime: string | null
}

/**
 * 回復結果
 */
export interface RecoveryResult {
  success: boolean
  error?: Error
  recoveryAction?: string
}

/**
 * エラーパターン定義
 */
const ERROR_PATTERNS = {
  network: [
    /failed to fetch/i,
    /network error/i,
    /connection refused/i,
    /timeout/i,
    /offline/i,
    /server unavailable/i,
    /network timeout/i
  ],
  permission: [
    /permission denied/i,
    /not allowed/i,
    /unauthorized/i,
    /access denied/i,
    /notification permission/i
  ],
  configuration: [
    /invalid configuration/i,
    /config error/i,
    /missing configuration/i,
    /invalid settings/i,
    /invalid notification configuration/i
  ],
  storage: [
    /storage error/i,
    /quota exceeded/i,
    /storage not available/i,
    /localstorage/i
  ]
} as const

/**
 * 通知エラーハンドリングcomposable
 */
export const useNotificationErrorHandler = () => {
  const logger = useNotificationLogger()
  
  // エラー統計
  const errorStats = ref<ErrorStats>({
    totalErrors: 0,
    errorsByCategory: {
      network: 0,
      permission: 0,
      configuration: 0,
      storage: 0,
      unknown: 0
    },
    errorsBySeverity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    },
    lastErrorTime: null
  })

  /**
   * エラー分類定義
   */
  const ERROR_CLASSIFICATIONS: Record<ErrorCategory, Omit<ErrorClassification, 'category'>> = {
    network: {
      severity: 'medium',
      recoverable: true,
      description: 'ネットワーク接続に関する問題です'
    },
    permission: {
      severity: 'high',
      recoverable: false,
      description: '通知の許可に関する問題です'
    },
    configuration: {
      severity: 'high',
      recoverable: true,
      description: 'アプリケーション設定に関する問題です'
    },
    storage: {
      severity: 'medium',
      recoverable: true,
      description: 'データ保存に関する問題です'
    },
    unknown: {
      severity: 'medium',
      recoverable: true,
      description: '予期しない問題が発生しました'
    }
  }

  /**
   * エラーメッセージからカテゴリを特定
   */
  const identifyErrorCategory = (message: string): ErrorCategory => {
    const lowerMessage = message.toLowerCase()
    
    for (const [category, patterns] of Object.entries(ERROR_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(lowerMessage))) {
        return category as ErrorCategory
      }
    }
    
    return 'unknown'
  }

  /**
   * エラーを分類
   */
  const classifyError = (error: Error): ErrorClassification => {
    const category = identifyErrorCategory(error.message)
    const classification = ERROR_CLASSIFICATIONS[category]
    
    return {
      category,
      ...classification
    }
  }

  /**
   * ユーザーフレンドリーなエラーメッセージを生成
   */
  const getUserFriendlyMessage = (error: Error): UserFriendlyErrorMessage => {
    const classification = classifyError(error)
    
    switch (classification.category) {
      case 'network':
        return {
          title: '接続エラー',
          description: 'ネットワーク接続に問題があります。インターネット接続を確認してください。',
          actions: ['再試行', 'オフラインモードに切り替え']
        }
        
      case 'permission':
        return {
          title: '許可エラー',
          description: '通知の許可が得られていません。ブラウザの設定で通知を許可してください。',
          actions: ['設定を確認', 'アプリ内通知のみ使用']
        }
        
      case 'configuration':
        return {
          title: '設定エラー',
          description: 'アプリケーションの設定に問題があります。設定をリセットしてください。',
          actions: ['設定をリセット', 'デフォルト設定を使用']
        }
        
      case 'storage':
        return {
          title: 'ストレージエラー',
          description: 'データの保存に問題があります。ブラウザのストレージ容量を確認してください。',
          actions: ['キャッシュをクリア', 'データを削除']
        }
        
      default:
        return {
          title: '予期しないエラー',
          description: '予期しない問題が発生しました。しばらく時間をおいて再試行してください。',
          actions: ['再試行', 'サポートに連絡']
        }
    }
  }

  /**
   * 共通回復アクション
   */
  const createRecoveryAction = (logMessage: string) => {
    return async (): Promise<boolean> => {
      logger.info(logMessage)
      return true
    }
  }

  /**
   * 回復オプション定義
   */
  const RECOVERY_OPTIONS: Record<ErrorCategory, RecoveryOption[]> = {
    network: [
      {
        label: '再試行',
        action: createRecoveryAction('ネットワークエラーの再試行を実行します'),
        priority: 1
      },
      {
        label: 'オフラインモードに切り替え',
        action: createRecoveryAction('オフラインモードに切り替えます'),
        priority: 2
      }
    ],
    permission: [
      {
        label: '許可を再要求',
        action: createRecoveryAction('通知許可の再要求を実行します'),
        priority: 1
      },
      {
        label: 'アプリ内通知のみ使用',
        action: createRecoveryAction('アプリ内通知のみに切り替えます'),
        priority: 2
      }
    ],
    configuration: [
      {
        label: '設定をリセット',
        action: createRecoveryAction('設定をリセットします'),
        priority: 1
      },
      {
        label: 'デフォルト設定を使用',
        action: createRecoveryAction('デフォルト設定を適用します'),
        priority: 2
      }
    ],
    storage: [
      {
        label: 'キャッシュをクリア',
        action: createRecoveryAction('キャッシュをクリアします'),
        priority: 1
      },
      {
        label: 'データを削除',
        action: createRecoveryAction('データを削除します'),
        priority: 2
      }
    ],
    unknown: [
      {
        label: '再試行',
        action: createRecoveryAction('一般的な再試行を実行します'),
        priority: 1
      },
      {
        label: 'サポートに連絡',
        action: createRecoveryAction('サポート連絡画面を表示します'),
        priority: 2
      }
    ]
  }

  /**
   * 回復オプションを取得
   */
  const getRecoveryOptions = (error: Error): RecoveryOption[] => {
    const classification = classifyError(error)
    return RECOVERY_OPTIONS[classification.category] || RECOVERY_OPTIONS.unknown
  }

  /**
   * エラーをログに記録
   */
  const logError = (error: Error, context?: Record<string, any>): void => {
    const classification = classifyError(error)
    
    // 統計を更新
    errorStats.value.totalErrors++
    errorStats.value.errorsByCategory[classification.category]++
    errorStats.value.errorsBySeverity[classification.severity]++
    errorStats.value.lastErrorTime = new Date().toISOString()
    
    // ログレベルを決定
    const logData = {
      error: error.message,
      stack: error.stack,
      classification,
      context,
      timestamp: new Date().toISOString()
    }
    
    switch (classification.severity) {
      case 'critical':
        logger.error('重大なエラーが発生しました', logData)
        break
      case 'high':
        logger.error('高重要度エラーが発生しました', logData)
        break
      case 'medium':
        logger.warn('中重要度エラーが発生しました', logData)
        break
      case 'low':
        logger.info('軽微なエラーが発生しました', logData)
        break
    }
  }

  /**
   * エラー統計を取得
   */
  const getErrorStats = (): ErrorStats => {
    return { ...errorStats.value }
  }

  /**
   * 回復を試行
   */
  const attemptRecovery = async (
    error: Error, 
    recoveryAction: () => Promise<boolean> | boolean
  ): Promise<RecoveryResult> => {
    try {
      logger.info('エラー回復を試行します', { error: error.message })
      
      const success = await recoveryAction()
      
      if (success) {
        logger.info('エラー回復が成功しました', { error: error.message })
        return { success: true }
      } else {
        logger.warn('エラー回復が失敗しました', { error: error.message })
        return { success: false }
      }
      
    } catch (recoveryError) {
      const normalizedError = recoveryError instanceof Error 
        ? recoveryError 
        : new Error('回復処理中に不明なエラーが発生しました')
      
      logger.error('エラー回復中に例外が発生しました', { 
        originalError: error.message,
        recoveryError: normalizedError.message
      })
      
      return { 
        success: false, 
        error: normalizedError 
      }
    }
  }

  /**
   * 統計をリセット
   */
  const resetStats = (): void => {
    errorStats.value = {
      totalErrors: 0,
      errorsByCategory: {
        network: 0,
        permission: 0,
        configuration: 0,
        storage: 0,
        unknown: 0
      },
      errorsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      lastErrorTime: null
    }
    
    logger.info('エラー統計をリセットしました')
  }

  return {
    // 状態
    errorStats: readonly(errorStats),
    
    // メソッド
    classifyError,
    getUserFriendlyMessage,
    getRecoveryOptions,
    logError,
    getErrorStats,
    attemptRecovery,
    resetStats
  }
}