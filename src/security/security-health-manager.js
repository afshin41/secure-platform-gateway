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
        return {
            status: "ok",
            security: {
                authenticatedNodes:
                    this.security.securityManager.count(),

                activeConnections:
                    this.security.connectionGuard.count(),

                rateLimitEntries:
                    this.security.rateLimiter.count(),

                replayEntries:
                    this.security.replayProtection.count(),

                auditEvents:
                    this.security.auditManager.count()
            },
            timestamp: Date.now()
        };
    }
}
