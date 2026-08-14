export class GatewayAuthorizationManager {
    constructor(
        config,
        authenticationManager,
        nodeAuthorizationManager,
        sessionAuthorizationManager,
        signalingAuthorizationManager
    ) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        if (
            !authenticationManager ||
            typeof authenticationManager.validate !== "function"
        ) {
            throw new Error(
                "invalid_authentication_manager"
            );
        }

        if (
            !nodeAuthorizationManager ||
            typeof nodeAuthorizationManager.authorize !== "function"
        ) {
            throw new Error(
                "invalid_node_authorization_manager"
            );
        }

        if (
            !sessionAuthorizationManager ||
            typeof sessionAuthorizationManager.authorize !== "function"
        ) {
            throw new Error(
                "invalid_session_authorization_manager"
            );
        }

        if (
            !signalingAuthorizationManager ||
            typeof signalingAuthorizationManager.authorizeSend !== "function" ||
            typeof signalingAuthorizationManager.authorizeReceive !== "function"
        ) {
            throw new Error(
                "invalid_signaling_authorization_manager"
            );
        }

        this.config = config;

        this.authenticationManager =
            authenticationManager;

        this.nodeAuthorizationManager =
            nodeAuthorizationManager;

        this.sessionAuthorizationManager =
            sessionAuthorizationManager;

        this.signalingAuthorizationManager =
            signalingAuthorizationManager;
    }

    authenticateNode(
        nodeId,
        enrollmentToken
    ) {
        return this.authenticationManager.authenticate(
            nodeId,
            enrollmentToken
        );
    }

    authorizeNode(
        nodeId,
        accessToken
    ) {
        return this.nodeAuthorizationManager.authorize(
            nodeId,
            accessToken
        );
    }

    authorizeSession(
        nodeId,
        accessToken,
        sessionId
    ) {
        return this.sessionAuthorizationManager.authorize(
            nodeId,
            accessToken,
            sessionId
        );
    }

    authorizeSignalSend(
        nodeId,
        accessToken,
        sessionId
    ) {
        return this.signalingAuthorizationManager.authorizeSend(
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
        return this.signalingAuthorizationManager.authorizeReceive(
            nodeId,
            accessToken,
            sessionId
        );
    }

    isAuthenticated(
        nodeId,
        accessToken
    ) {
        return this.authenticationManager.validate(
            nodeId,
            accessToken
        );
    }

    revokeNode(nodeId) {
        this.authenticationManager.revoke(nodeId);
    }

    revokeAll() {
        this.authenticationManager.revokeAll();
    }
}
