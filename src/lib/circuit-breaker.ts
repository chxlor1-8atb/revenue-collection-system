export class CircuitBreaker {
  private failureThreshold: number;
  private resetTimeout: number;
  private failureCount: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private nextAttempt: number = 0;

  constructor(failureThreshold: number = 3, resetTimeoutMs: number = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeoutMs;
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    const now = Date.now();

    if (this.state === 'OPEN') {
      if (now >= this.nextAttempt) {
        // Time to try again
        this.state = 'HALF_OPEN';
      } else {
        throw new Error("Circuit breaker is OPEN. Fast failing.");
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }

  getState() {
    return this.state;
  }
}

// Global instance to maintain state across edge invocations (best effort in serverless)
export const slip2goCircuitBreaker = new CircuitBreaker(3, 120000); // 3 failures -> open for 2 mins
