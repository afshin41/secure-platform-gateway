export class SecurityRateLimiter {
    constructor(config) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        this.config = config;
        this.buckets = new Map();

        this.maxAttempts =
            Number.isInteger(config.maxAuthAttempts) &&
            config.maxAuthAttempts > 0
                ? config.maxAuthAttempts
                : 10;

        this.windowMs =
            Number.isInteger(config.authRateWindowMs) &&
            config.authRateWindowMs > 0
                ? config.authRateWindowMs
                : 60000;
    }

    cleanup(now = Date.now()) {
        for (const [key, bucket] of this.buckets) {
            if (
                now - bucket.windowStart >=
                this.windowMs
            ) {
                this.buckets.delete(key);
            }
        }
    }

    check(key) {
        if (
            typeof key !== "string" ||
            key.length === 0
        ) {
            throw new Error("invalid_rate_limit_key");
        }

        const now = Date.now();

        this.cleanup(now);

        let bucket = this.buckets.get(key);

        if (!bucket) {
            bucket = {
                count: 0,
                windowStart: now
            };

            this.buckets.set(key, bucket);
        }

        if (
            now - bucket.windowStart >=
            this.windowMs
        ) {
            bucket.count = 0;
            bucket.windowStart = now;
        }

        if (bucket.count >= this.maxAttempts) {
            return {
                allowed: false,
                remaining: 0,
                retryAfterMs:
                    this.windowMs -
                    (now - bucket.windowStart)
            };
        }

        bucket.count += 1;

        return {
            allowed: true,
            remaining:
                this.maxAttempts -
                bucket.count,
            retryAfterMs: 0
        };
    }

    consume(key) {
        const result = this.check(key);

        if (!result.allowed) {
            throw new Error(
                "rate_limit_exceeded"
            );
        }

        return result;
    }

    reset(key) {
        if (
            typeof key !== "string" ||
            key.length === 0
        ) {
            throw new Error("invalid_rate_limit_key");
        }

        this.buckets.delete(key);
    }

    resetAll() {
        this.buckets.clear();
    }

    size() {
        this.cleanup();

        return this.buckets.size;
    }
}
