/**
 * RequestQueue - Rate-limited request queue with serialization
 * 
 * Ensures requests are spaced out by a minimum delay to respect API rate limits.
 * Requests are processed sequentially to prevent overwhelming the target API.
 */

/**
 * Helper to delay execution
 */
export const delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

/**
 * A queue that serializes requests with a minimum delay between each.
 * Useful for APIs with rate limits (e.g., Jikan allows ~3 requests/sec).
 */
export class RequestQueue {
    private queue: (() => Promise<void>)[] = [];
    private processing = false;
    private lastRequestTime = 0;
    private readonly minDelay: number;

    /**
     * Create a new RequestQueue
     * @param minDelay - Minimum milliseconds between requests
     */
    constructor(minDelay: number) {
        this.minDelay = minDelay;
    }

    /**
     * Add a request to the queue
     * @param fn - Async function to execute
     * @returns Promise that resolves with the function's result
     */
    async add<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            this.process();
        });
    }

    /**
     * Process queued requests sequentially with rate limiting
     */
    private async process(): Promise<void> {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;
        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                const now = Date.now();
                const timeSinceLast = now - this.lastRequestTime;

                if (timeSinceLast < this.minDelay) {
                    await delay(this.minDelay - timeSinceLast);
                }

                try {
                    await task();
                } catch (e) {
                    console.error('[RequestQueue] Task error:', e);
                }

                this.lastRequestTime = Date.now();
            }
        }
        this.processing = false;
    }

    /**
     * Get the current queue length
     */
    get length(): number {
        return this.queue.length;
    }

    /**
     * Check if currently processing
     */
    get isProcessing(): boolean {
        return this.processing;
    }
}
