export class SignalingAuthorizationManager {
    constructor(
        config,
        sessionAuthorizationManager,
        signalingService
    ) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
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
            !signalingService ||
            typeof signalingService.send !== "function" ||
            typeof signalingService.receive !== "function"
        ) {
            throw new Error(
                "invalid_signaling_service"
            );
        }

        this.config = config;

        this.sessionAuthorizationManager =
            sessionAuthorizationManager;

        this.signalingService =
            signalingService;
    }

    authorizeSend(
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

    authorizeReceive(
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

    send(
        nodeId,
        accessToken,
        sessionId,
        signalType,
        payload
    ) {
        this.authorizeSend(
            nodeId,
            accessToken,
            sessionId
        );

        if (
            typeof signalType !== "string" ||
            signalType.length === 0
        ) {
            throw new Error(
                "invalid_signal_type"
            );
        }

        if (payload === undefined) {
            throw new Error(
                "signal_payload_required"
            );
        }

        return this.signalingService.send(
            sessionId,
            nodeId,
            signalType,
            payload
        );
    }

    receive(
        nodeId,
        accessToken,
        sessionId
    ) {
        this.authorizeReceive(
            nodeId,
            accessToken,
            sessionId
        );

        return this.signalingService.receive(
            sessionId,
            nodeId
        );
    }
}
