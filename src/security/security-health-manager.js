export class SecurityHealthManager {
    constructor(config, security) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        if (!security || typeof security !== "object") {
            throw new Error("invalid_security");
        }

        this.config = config;
        this.security = security;
    }

    getStatus() {
        const authenticatedNodes =
            this.security.securityManager.count();

        const activeConnections =
            this.security.connectionGuard.count();

        const rateLimitEntries =
            this.security.rateLimiter.count();

        const replayEntries =
            this.security.replayProtection.count();

        const auditEvents =
            this.security.auditManager.count();

        const healthy =
            authenticatedNodes >= 0 &&
            activeConnections >= 0 &&
            rateLimitEntries >= 0 &&
            replayEntries >= 0 &&
            auditEvents >= 0;

        return {
            status: healthy ? "ok" : "degraded",
            security: {
                authenticatedNodes,
                activeConnections,
                rateLimitEntries,
                replayEntries,
                auditEvents
            },
            timestamp: Date.now()
        };
    }
}
