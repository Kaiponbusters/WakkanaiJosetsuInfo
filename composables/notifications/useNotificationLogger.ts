import { ref } from 'vue'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: any
}

export interface NotificationLogger {
  debug(message: string, context?: any): void
  info(message: string, context?: any): void
  warn(message: string, context?: any): void
  error(message: string, context?: any): void
  getLogs(): LogEntry[]
  clearLogs(): void
}

const LOG_PREFIX = '[NotificationSystem]'
const MAX_LOG_ENTRIES = 100

export const useNotificationLogger = (): NotificationLogger => {
  const logs = ref<LogEntry[]>([])

  const createLogEntry = (level: LogLevel, message: string, context?: any): LogEntry => ({
    level,
    message,
    timestamp: new Date().toISOString(),
    context
  })

  const addLog = (entry: LogEntry): void => {
    logs.value.unshift(entry)
    
    // Limit log entries to prevent memory issues
    if (logs.value.length > MAX_LOG_ENTRIES) {
      logs.value.splice(MAX_LOG_ENTRIES)
    }
  }

  const debug = (message: string, context?: any): void => {
    const entry = createLogEntry('debug', message, context)
    addLog(entry)
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${LOG_PREFIX} ${message}`, context || '')
    }
  }

  const info = (message: string, context?: any): void => {
    const entry = createLogEntry('info', message, context)
    addLog(entry)
    
    console.info(`${LOG_PREFIX} ${message}`, context || '')
  }

  const warn = (message: string, context?: any): void => {
    const entry = createLogEntry('warn', message, context)
    addLog(entry)
    
    console.warn(`${LOG_PREFIX} ${message}`, context || '')
  }

  const error = (message: string, context?: any): void => {
    const entry = createLogEntry('error', message, context)
    addLog(entry)
    
    console.error(`${LOG_PREFIX} ${message}`, context || '')
  }

  const getLogs = (): LogEntry[] => {
    return [...logs.value]
  }

  const clearLogs = (): void => {
    logs.value = []
  }

  return {
    debug,
    info,
    warn,
    error,
    getLogs,
    clearLogs
  }
}