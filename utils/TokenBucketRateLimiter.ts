/**
 * Token Bucket Rate Limiter
 * レート制限のためのトークンバケットアルゴリズム実装
 */

export interface RateLimiterConfig {
  maxTokens: number
  refillRate: number // milliseconds
}

export interface RateLimiterStatus {
  tokensRemaining: number
  nextRefillTime: number
}

export class TokenBucketRateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly config: RateLimiterConfig

  constructor(config: RateLimiterConfig) {
    this.validateConfig(config)
    this.config = { ...config }
    this.tokens = config.maxTokens
    this.lastRefill = this.getCurrentTime()
  }

  /**
   * リクエストの実行可能性をチェック
   * @returns true if request can proceed, false if rate limited
   */
  async canProceed(): Promise<boolean> {
    this.refillTokensIfNeeded()
    return this.consumeTokenIfAvailable()
  }

  /**
   * 現在のレート制限状態を取得
   */
  getStatus(): RateLimiterStatus {
    this.refillTokensIfNeeded()
    return {
      tokensRemaining: this.tokens,
      nextRefillTime: this.lastRefill + this.config.refillRate
    }
  }

  /**
   * レート制限をリセット
   */
  reset(): void {
    this.tokens = this.config.maxTokens
    this.lastRefill = this.getCurrentTime()
  }

  private validateConfig(config: RateLimiterConfig): void {
    if (config.maxTokens <= 0) {
      throw new Error('maxTokens must be greater than 0')
    }
    if (config.refillRate <= 0) {
      throw new Error('refillRate must be greater than 0')
    }
  }

  private refillTokensIfNeeded(): void {
    const now = this.getCurrentTime()
    const timePassed = now - this.lastRefill
    
    if (this.shouldRefillTokens(timePassed)) {
      const tokensToAdd = this.calculateTokensToAdd(timePassed)
      this.addTokens(tokensToAdd)
      this.updateLastRefillTime(now)
    }
  }

  private shouldRefillTokens(timePassed: number): boolean {
    return timePassed >= this.config.refillRate
  }

  private calculateTokensToAdd(timePassed: number): number {
    return Math.floor(timePassed / this.config.refillRate)
  }

  private addTokens(tokensToAdd: number): void {
    this.tokens = Math.min(this.config.maxTokens, this.tokens + tokensToAdd)
  }

  private updateLastRefillTime(now: number): void {
    this.lastRefill = now
  }

  private consumeTokenIfAvailable(): boolean {
    if (this.hasTokensAvailable()) {
      this.tokens--
      return true
    }
    return false
  }

  private hasTokensAvailable(): boolean {
    return this.tokens > 0
  }

  private getCurrentTime(): number {
    return Date.now()
  }
}