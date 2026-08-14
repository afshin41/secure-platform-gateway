export class SessionAuthorizationManager {
    constructor(
        config,
        nodeAuthorizationManager,
        sessionManager
    ) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        if (
            !nodeAuthorizationManager ||
            typeof nodeAuthorizationManager.authorizeParticipant !== "function"
        ) {
            throw new Error(
                "invalid_node_authorization_manager"
            );
        }

        if (
            !sessionManager ||
            typeof sessionManager.get !== "function"
        ) {
            throw new Error(
                "invalid_session_manager"
            );
        }

        this.config = config;

        this.nodeAuthorizationManager =
            nodeAuthorizationManager;

        this.sessionManager =
            sessionManager;
    }

    authorize(
        nodeId,
        accessToken,
        sessionId
    ) {
        if (
            typeof sessionId !== "string" ||
            sessionId.length === 0
        ) {
            throw new Error(
                "invalid_session_id"
            );
        }

        const session =
            this.sessionManager.get(sessionId);

        if (!session) {
            throw new Error(
                "session_not_found"
            );
        }

        return this.nodeAuthorizationManager.authorizeParticipant(
            nodeId,
            accessToken,
            session
        );
    }

    authorizeInitiator(
        nodeId,
        accessToken,
        sessionId
    ) {
        const session =
            this.requireSession(sessionId);

        if (session.initiator !== nodeId) {
            throw new Error(
                "node_not_initiator"
            );
        }

        return this.nodeAuthorizationManager.authorizeParticipant(
            nodeId,
            accessToken,
            session
        );
    }

    authorizeTarget(
        nodeId,
        accessToken,
        sessionId
    ) {
        const session =
            this.requireSession(sessionId);

        if (session.target !== nodeId) {
            throw new Error(
                "node_not_target"
            );
        }

        return this.nodeAuthorizationManager.authorizeParticipant(
            nodeId,
            accessToken,
            session
        );
    }

    requireSession(sessionId) {
        if (
            typeof sessionId !== "string" ||
            sessionId.length === 0
        ) {
            throw new Error(
                "invalid_session_id"
            );
        }

        const session =
            this.sessionManager.get(sessionId);

        if (!session) {
            throw new Error(
                "session_not_found"
            );
        }

        return session;
    }

    isParticipant(
        nodeId,
        sessionId
    ) {
        const session =
            this.requireSession(sessionId);

        return (
            session.initiator === nodeId ||
            session.target === nodeId
        );
    }
}
