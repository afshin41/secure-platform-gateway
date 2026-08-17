export class SecuritySignalingGuard {
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
            typeof securityPolicyManager.requireSignalingAuthorization !== "function"
        ) {
            throw new Error(
                "invalid_security_policy_manager"
            );
        }

        if (
            !authorizationManager ||
            typeof authorizationManager.authorizeSignalSend !== "function" ||
            typeof authorizationManager.authorizeSignalReceive !== "function"
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

    authorizeSend(
        nodeId,
        accessToken,
        sessionId
    ) {
        this.securityPolicyManager
            .requireSignalingAuthorization();

        const authorized =
            this.authorizationManager
                .authorizeSignalSend(
                    nodeId,
                    accessToken,
                    sessionId
                );

        if (!authorized) {
            this.auditManager.recordAuthorization(
                nodeId,
                `signal.send:${sessionId}`,
                false
            );

            throw new Error(
                "signal_send_not_authorized"
            );
        }

        this.auditManager.recordAuthorization(
            nodeId,
            `signal.send:${sessionId}`,
            true
        );

        return true;
    }

    authorizeReceive(
        nodeId,
        accessToken,
        sessionId
    ) {
        this.securityPolicyManager
            .requireSignalingAuthorization();

        const authorized =
            this.authorizationManager
                .authorizeSignalReceive(
                    nodeId,
                    accessToken,
                    sessionId
                );

        if (!authorized) {
            this.auditManager.recordAuthorization(
                nodeId,
                `signal.receive:${sessionId}`,
                false
            );

            throw new Error(
                "signal_receive_not_authorized"
            );
        }

        this.auditManager.recordAuthorization(
            nodeId,
            `signal.receive:${sessionId}`,
            true
        );

        return true;
    }
}
