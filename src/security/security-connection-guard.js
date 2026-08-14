export class SecurityConnectionGuard {
    constructor(
        config,
        securityPolicyManager,
        rateLimiter,
        auditManager
    ) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        if (
            !securityPolicyManager ||
            typeof securityPolicyManager.requireAuthentication !== "function"
        ) {
            throw new Error(
                "invalid_security_policy_manager"
            );
        }

        if (
            !rateLimiter ||
            typeof rateLimiter.consume !== "function"
        ) {
            throw new Error(
                "invalid_rate_limiter"
            );
        }

        if (
            !auditManager ||
            typeof auditManager.recordSecurityViolation !== "function"
        ) {
            throw new Error(
                "invalid_audit_manager"
            );
        }

        this.config = config;
        this.securityPolicyManager =
            securityPolicyManager;
        this.rateLimiter = rateLimiter;
        this.auditManager = auditManager;

        this.connections = new Map();
    }

    accept(connectionId) {
        if (
            typeof connectionId !== "string" ||
            connectionId.length === 0
        ) {
            throw new Error(
                "invalid_connection_id"
            );
        }

        this.securityPolicyManager
            .requireAuthentication();

        this.rateLimiter.consume(
            `connection:${connectionId}`
        );

        this.connections.set(
            connectionId,
            {
                connectionId,
                acceptedAt: Date.now()
            }
        );

        return true;
    }

    requireAccepted(connectionId) {
        if (
            typeof connectionId !== "string" ||
            connectionId.length === 0
        ) {
            throw new Error(
                "invalid_connection_id"
            );
        }

        if (
            !this.connections.has(connectionId)
        ) {
            this.auditManager
                .recordSecurityViolation(
                    null,
                    "connection_not_accepted"
                );

            throw new Error(
                "connection_not_accepted"
            );
        }

        return true;
    }

    remove(connectionId) {
        if (
            typeof connectionId !== "string" ||
            connectionId.length === 0
        ) {
            throw new Error(
                "invalid_connection_id"
            );
        }

        this.connections.delete(
            connectionId
        );
    }

    clear() {
        this.connections.clear();
    }

    count() {
        return this.connections.size;
    }
}
