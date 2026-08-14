export class SecurityRateLimiter {
    constructor(config) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        this.config = config;

        this.windowMs =
            Number.isInteger(
                config.securityRateWindowMs
            ) &&
            config.securityRateWindowMs > 0
                ? config.securityRateWindowMs
                : 60 * 1000;

        this.maxRequests =
            Number.isInteger(
                config.securityRateMaxRequests
            ) &&
            config.securityRateMaxRequests > 0
                ? config.securityRateMaxRequests
                : 100;

        this.entries = new Map();
    }

    cleanup() {
        const now = Date.now();

        for (
            const [key, entry]
            of this.entries
        ) {
            if (
                entry.expiresAt <= now
            ) {
                this.entries.delete(key);
            }
        }
    }

    consume(key) {
        if (
            typeof key !== "string" ||
            key.length === 0
        ) {
            throw new Error(
                "invalid_rate_limit_key"
            );
        }

        this.cleanup();

        const now = Date.now();

        let entry =
            this.entries.get(key);

        if (!entry) {
            entry = {
                count: 0,
                expiresAt:
                    now + this.windowMs
            };

            this.entries.set(
                key,
                entry
            );
        }

        if (
            entry.count >=
            this.maxRequests
        ) {
            throw new Error(
                "rate_limit_exceeded"
            );
        }

        entry.count += 1;

        return {
            allowed: true,
            remaining:
                this.maxRequests -
                entry.count,
            expiresAt:
                entry.expiresAt
        };
    }

    reset(key) {
        if (
            typeof key !== "string" ||
            key.length === 0
        ) {
            throw new Error(
                "invalid_rate_limit_key"
            );
        }

        this.entries.delete(key);
    }

    clear() {
        this.entries.clear();
    }

    count() {
        this.cleanup();
        return this.entries.size;
    }
}
