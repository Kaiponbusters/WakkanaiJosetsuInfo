import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TokenBucketRateLimiter } from './TokenBucketRateLimiter'

describe('TokenBucketRateLimiter', () => {
  let rateLimiter: TokenBucketRateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
    rateLimiter = new TokenBucketRateLimiter({
      maxTokens: 1,
      refillRate: 1000 // 1秒ごとに1トークン
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow request when tokens are available', async () => {
    const canProceed = await rateLimiter.canProceed()
    expect(canProceed).toBe(true)
  })

  it('should deny request when no tokens available', async () => {
    // 最初のリクエストでトークンを消費
    await rateLimiter.canProceed()
    
    // 2回目のリクエストは拒否されるべき
    const canProceed = await rateLimiter.canProceed()
    expect(canProceed).toBe(false)
  })

  it('should refill tokens after specified time', async () => {
    // トークンを消費
    await rateLimiter.canProceed()
    
    // 1秒経過させる
    vi.advanceTimersByTime(1000)
    
    // トークンが補充されているべき
    const canProceed = await rateLimiter.canProceed()
    expect(canProceed).toBe(true)
  })

  it('should provide status information', () => {
    const status = rateLimiter.getStatus()
    expect(status.tokensRemaining).toBe(1)
    expect(typeof status.nextRefillTime).toBe('number')
  })

  it('should reset rate limiter state', async () => {
    // トークンを消費
    await rateLimiter.canProceed()
    expect(rateLimiter.getStatus().tokensRemaining).toBe(0)
    
    // リセット
    rateLimiter.reset()
    expect(rateLimiter.getStatus().tokensRemaining).toBe(1)
  })

  it('should validate configuration', () => {
    expect(() => new TokenBucketRateLimiter({ maxTokens: 0, refillRate: 1000 }))
      .toThrow('maxTokens must be greater than 0')
    
    expect(() => new TokenBucketRateLimiter({ maxTokens: 1, refillRate: 0 }))
      .toThrow('refillRate must be greater than 0')
  })
})