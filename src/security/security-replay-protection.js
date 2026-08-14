import crypto from "node:crypto";

export class SecurityReplayProtection {
    constructor(config) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        this.config = config;

        this.ttlMs =
            Number.isInteger(
                config.securityReplayTtlMs
            ) &&
            config.securityReplayTtlMs > 0
                ? config.securityReplayTtlMs
                : 5 * 60 * 1000;

        this.maxEntries =
            Number.isInteger(
                config.securityReplayMaxEntries
            ) &&
            config.securityReplayMaxEntries > 0
                ? config.securityReplayMaxEntries
                : 100000;

        this.entries = new Map();
    }

    createRequestId() {
        return crypto.randomBytes(24).toString("base64url");
    }

    cleanup() {
        const now = Date.now();

        for (
            const [requestId, expiresAt]
            of this.entries
        ) {
            if (expiresAt <= now) {
                this.entries.delete(requestId);
            }
        }
    }

    register(requestId) {
        if (
            typeof requestId !== "string" ||
            requestId.length === 0 ||
            requestId.length > 256
        ) {
            throw new Error(
                "invalid_request_id"
            );
        }

        this.cleanup();

        if (this.entries.has(requestId)) {
            throw new Error(
                "replayed_request"
            );
        }

        if (
            this.entries.size >=
            this.maxEntries
        ) {
            throw new Error(
                "replay_protection_capacity_reached"
            );
        }

        this.entries.set(
            requestId,
            Date.now() + this.ttlMs
        );

        return true;
    }

    has(requestId) {
        if (
            typeof requestId !== "string" ||
            requestId.length === 0
        ) {
            return false;
        }

        this.cleanup();

        return this.entries.has(
            requestId
        );
    }

    remove(requestId) {
        if (
            typeof requestId !== "string" ||
            requestId.length === 0
        ) {
            return false;
        }

        return this.entries.delete(
            requestId
        );
    }

    clear() {
        this.entries.clear();
    }

    count() {
        this.cleanup();
        return this.entries.size;
    }
}
