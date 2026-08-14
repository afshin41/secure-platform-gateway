export class SecuritySessionLifecycleManager {
    constructor(
        config,
        sessionManager,
        securityNodeLifecycleManager
    ) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        if (!sessionManager) {
            throw new Error("session_manager_required");
        }

        if (!securityNodeLifecycleManager) {
            throw new Error(
                "security_node_lifecycle_manager_required"
            );
        }

        this.config = config;
        this.sessionManager = sessionManager;
        this.securityNodeLifecycleManager =
            securityNodeLifecycleManager;
    }

    validateParticipant(
        nodeId,
        accessToken
    ) {
        if (
            !this.securityNodeLifecycleManager.validateNode(
                nodeId,
                accessToken
            )
        ) {
            throw new Error(
                "node_authentication_failed"
            );
        }

        return true;
    }

    createSession(
        initiator,
        target,
        initiatorAccessToken
    ) {
        this.validateParticipant(
            initiator,
            initiatorAccessToken
        );

        if (
            typeof target !== "string" ||
            target.length === 0
        ) {
            throw new Error(
                "invalid_session_target"
            );
        }

        if (initiator === target) {
            throw new Error(
                "self_session_forbidden"
            );
        }

        if (
            !this.securityNodeLifecycleManager.hasNode(
                target
            )
        ) {
            throw new Error(
                "target_not_authenticated"
            );
        }

        return this.sessionManager.create(
            initiator,
            target
        );
    }

    validateSessionParticipant(
        sessionId,
        nodeId,
        accessToken
    ) {
        this.validateParticipant(
            nodeId,
            accessToken
        );

        const session =
            this.sessionManager.get(
                sessionId
            );

        if (!session) {
            throw new Error(
                "session_not_found"
            );
        }

        if (
            !this.sessionManager.isParticipant(
                session,
                nodeId
            )
        ) {
            throw new Error(
                "node_not_participant"
            );
        }

        return session;
    }

    updateSessionState(
        sessionId,
        nodeId,
        accessToken,
        state
    ) {
        this.validateSessionParticipant(
            sessionId,
            nodeId,
            accessToken
        );

        return this.sessionManager.updateState(
            sessionId,
            nodeId,
            state
        );
    }

    closeSession(
        sessionId,
        nodeId,
        accessToken
    ) {
        this.validateSessionParticipant(
            sessionId,
            nodeId,
            accessToken
        );

        return this.sessionManager.close(
            sessionId,
            nodeId
        );
    }

    removeNode(nodeId) {
        this.sessionManager.removeNode(
            nodeId
        );
    }
}
