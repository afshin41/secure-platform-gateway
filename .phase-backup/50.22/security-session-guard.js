export class SecuritySessionGuard {
    constructor(
        config,
        securityPolicyManager,
        authorizationManager,
        auditManager
    ) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        if (
            !securityPolicyManager ||
            typeof securityPolicyManager.requireSessionAuthorization !== "function" ||
            typeof securityPolicyManager.preventSelfSession !== "function"
        ) {
            throw new Error(
                "invalid_security_policy_manager"
            );
        }

        if (
            !authorizationManager ||
            typeof authorizationManager.authorizeSession !== "function"
        ) {
            throw new Error(
                "invalid_authorization_manager"
            );
        }

        if (
            !auditManager ||
            typeof auditManager.recordAuthorization !== "function"
        ) {
            throw new Error(
                "invalid_audit_manager"
            );
        }

        this.config = config;
        this.securityPolicyManager =
            securityPolicyManager;
        this.authorizationManager =
            authorizationManager;
        this.auditManager =
            auditManager;
    }

    authorizeCreate(
        nodeId,
        accessToken,
        targetNodeId
    ) {
        this.securityPolicyManager
            .requireSessionAuthorization();

        this.securityPolicyManager
            .preventSelfSession(
                nodeId,
                targetNodeId
            );

        const authorized =
            this.authorizationManager.authorizeNode(
                nodeId,
                accessToken
            );

        if (!authorized) {
            this.auditManager.recordAuthorization(
                nodeId,
                "session.create",
                false
            );

            throw new Error(
                "session_creation_not_authorized"
            );
        }

        this.auditManager.recordAuthorization(
            nodeId,
            "session.create",
            true
        );

        return true;
    }

    authorizeSession(
        nodeId,
        accessToken,
        sessionId
    ) {
        this.securityPolicyManager
            .requireSessionAuthorization();

        const authorized =
            this.authorizationManager.authorizeSession(
                nodeId,
                accessToken,
                sessionId
            );

        if (!authorized) {
            this.auditManager.recordAuthorization(
                nodeId,
                `session:${sessionId}`,
                false
            );

            throw new Error(
                "session_not_authorized"
            );
        }

        this.auditManager.recordAuthorization(
            nodeId,
            `session:${sessionId}`,
            true
        );

        return true;
    }
}
