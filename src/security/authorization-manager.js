export class AuthorizationManager {
    constructor(
        config,
        securityManager,
        sessionManager
    ) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        if (
            !securityManager ||
            typeof securityManager.validateAccessToken !== "function"
        ) {
            throw new Error(
                "invalid_security_manager"
            );
        }

        if (
            !sessionManager ||
            typeof sessionManager.get !== "function" ||
            typeof sessionManager.isParticipant !== "function"
        ) {
            throw new Error(
                "invalid_session_manager"
            );
        }

        this.config = config;
        this.securityManager = securityManager;
        this.sessionManager = sessionManager;
    }

    authorizeNode(
        nodeId,
        accessToken
    ) {
        return this.securityManager
            .validateAccessToken(
                nodeId,
                accessToken
            );
    }

    authorizeSession(
        nodeId,
        accessToken,
        sessionId
    ) {
        if (
            !this.authorizeNode(
                nodeId,
                accessToken
            )
        ) {
            return false;
        }

        const session =
            this.sessionManager.get(
                sessionId
            );

        if (!session) {
            return false;
        }

        return this.sessionManager
            .isParticipant(
                session,
                nodeId
            );
    }

    authorizeSignalSend(
        nodeId,
        accessToken,
        sessionId
    ) {
        return this.authorizeSession(
            nodeId,
            accessToken,
            sessionId
        );
    }

    authorizeSignalReceive(
        nodeId,
        accessToken,
        sessionId
    ) {
        return this.authorizeSession(
            nodeId,
            accessToken,
            sessionId
        );
    }
}
