/**
 * Client-Side Rate Limiter & Throttling Utility
 * Provides in-memory token-bucket / cooldown guards and standardized 429 error handling.
 */

export interface RateLimitState {
  isLimited: boolean;
  remainingSeconds: number;
  message: string | null;
  quotaRemaining?: number;
  quotaTotal?: number;
}

export interface ClientCooldownGuard {
  canProceed: () => boolean;
  getRemainingSeconds: () => number;
  recordAction: () => void;
  reset: () => void;
}

/**
 * Creates a client-side action cooldown to prevent rapid spam clicks
 * @param cooldownMs Duration in milliseconds (e.g. 2000 for 2 seconds)
 */
export function createActionCooldown(cooldownMs: number = 2000): ClientCooldownGuard {
  let lastActionTimestamp = 0;

  return {
    canProceed: () => {
      const now = Date.now();
      return now - lastActionTimestamp >= cooldownMs;
    },
    getRemainingSeconds: () => {
      const now = Date.now();
      const elapsed = now - lastActionTimestamp;
      if (elapsed >= cooldownMs) return 0;
      return Math.ceil((cooldownMs - elapsed) / 1000);
    },
    recordAction: () => {
      lastActionTimestamp = Date.now();
    },
    reset: () => {
      lastActionTimestamp = 0;
    }
  };
}

/**
 * Parses HTTP Response headers and body for 429 Rate Limit information
 */
export async function parseRateLimitResponse(response: Response): Promise<{
  isRateLimited: boolean;
  retryAfterSeconds: number;
  message: string;
  limit?: number;
  remaining?: number;
}> {
  if (response.status !== 429) {
    return {
      isRateLimited: false,
      retryAfterSeconds: 0,
      message: ''
    };
  }

  // Extract from standard Retry-After header or RateLimit-* headers
  const retryAfterHeader = response.headers.get('Retry-After');
  let retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
  if (isNaN(retryAfterSeconds) || retryAfterSeconds <= 0) {
    retryAfterSeconds = 60;
  }

  const limitHeader = response.headers.get('RateLimit-Limit') || response.headers.get('X-RateLimit-Limit');
  const remainingHeader = response.headers.get('RateLimit-Remaining') || response.headers.get('X-RateLimit-Remaining');

  let customMessage = 'Rate limit reached. Please slow down and try again shortly.';
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.clone().json();
      if (data.error) customMessage = data.error;
      if (data.retryAfterSeconds) retryAfterSeconds = Number(data.retryAfterSeconds);
    }
  } catch (e) {
    // Ignore body parsing errors
  }

  return {
    isRateLimited: true,
    retryAfterSeconds,
    message: customMessage,
    limit: limitHeader ? parseInt(limitHeader, 10) : undefined,
    remaining: remainingHeader ? parseInt(remainingHeader, 10) : 0
  };
}
