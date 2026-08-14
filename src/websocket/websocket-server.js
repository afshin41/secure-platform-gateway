import { WebSocketServer, WebSocket } from "ws";

import {
    MESSAGE_TYPES,
    SESSION_STATES,
    createError,
    createResponse,
    parseMessage
} from "../protocol/protocol.js";

export class PlatformWebSocketServer {
    constructor(
        server,
        config,
        sessionManager,
        signalingService,
        security
    ) {
        this.config = config;
        this.sessionManager = sessionManager;
        this.signalingService = signalingService;
        this.security = security;

        this.nodes = new Map();

        this.wss = new WebSocketServer({
            server,
            maxPayload: config.maxMessageBytes
        });

        this.wss.on(
            "connection",
            socket => this.handleConnection(socket)
        );
    }

    handleConnection(socket) {
        socket.nodeId = null;
        socket.accessToken = null;

        socket.on("message", raw => {
            this.handleMessage(socket, raw);
        });

        socket.on("close", () => {
            this.handleClose(socket);
        });

        socket.on("error", () => {
            this.handleClose(socket);
        });
    }

    handleMessage(socket, raw) {
        let message;

        try {
            message = parseMessage(
                raw.toString()
            );
        } catch (error) {
            this.send(
                socket,
                createError(
                    null,
                    error.message,
                    "Invalid protocol message"
                )
            );

            return;
        }

        try {
            if (
                message.request_id !== null &&
                message.request_id !== undefined
            ) {
                this.security.gatewayGuard
                    .validateRequest(
                        message.request_id,
                        socket.nodeId ||
                            `anonymous:${socket._socket?.remoteAddress || "unknown"}`
                    );
            }

            switch (message.type) {
                case MESSAGE_TYPES.NODE_REGISTER:
                    this.registerNode(
                        socket,
                        message
                    );
                    break;

                case MESSAGE_TYPES.NODE_REFRESH:
                    this.refreshNode(
                        socket,
                        message
                    );
                    break;

                case MESSAGE_TYPES.SESSION_CREATE:
                    this.createSession(
                        socket,
                        message
                    );
                    break;

                case MESSAGE_TYPES.SESSION_STATE:
                    this.updateSessionState(
                        socket,
                        message
                    );
                    break;

                case MESSAGE_TYPES.SESSION_CLOSE:
                    this.closeSession(
                        socket,
                        message
                    );
                    break;

                case MESSAGE_TYPES.SIGNAL_SEND:
                    this.sendSignal(
                        socket,
                        message
                    );
                    break;

                case MESSAGE_TYPES.SIGNAL_RECEIVE:
                    this.receiveSignals(
                        socket,
                        message
                    );
                    break;

                default:
                    this.send(
                        socket,
                        createError(
                            message.request_id,
                            "unsupported_message_type",
                            "Unsupported protocol message type"
                        )
                    );
            }
        } catch (error) {
            this.send(
                socket,
                createError(
                    message.request_id,
                    error.message,
                    "Request rejected"
                )
            );
        }
    }

    registerNode(socket, message) {
        const registration =
            this.security.inputValidator
                .validateNodeRegistration(
                    message.payload
                );

        const authentication =
            this.security.gatewayGuard
                .authenticateNode(
                    registration.nodeId,
                    message.payload.enrollment_token
                );

        const existing =
            this.nodes.get(
                registration.nodeId
            );

        if (
            existing &&
            existing !== socket &&
            existing.readyState === WebSocket.OPEN
        ) {
            throw new Error(
                "node_already_connected"
            );
        }

        if (
            this.nodes.size >=
                this.config.maxNodes &&
            !existing
        ) {
            throw new Error(
                "node_capacity_reached"
            );
        }

        socket.nodeId =
            registration.nodeId;

        socket.accessToken =
            authentication.accessToken;

        this.nodes.set(
            registration.nodeId,
            socket
        );

        this.send(
            socket,
            createResponse(
                message.request_id,
                MESSAGE_TYPES.NODE_REGISTER,
                {
                    status: "registered",
                    node_id:
                        registration.nodeId,
                    device_name:
                        registration.deviceName,
                    node_type:
                        registration.nodeType,
                    access_token:
                        authentication.accessToken,
                    authenticated_at:
                        authentication.authenticatedAt
                }
            )
        );
    }

    refreshNode(socket, message) {
        this.requireAuthenticated(socket);

        const result =
            this.security.nodeLifecycleManager
                .refreshNode(
                    socket.nodeId,
                    socket.accessToken
                );

        this.send(
            socket,
            createResponse(
                message.request_id,
                MESSAGE_TYPES.NODE_REFRESH,
                {
                    status: "refreshed",
                    node_id:
                        result.nodeId,
                    last_seen_at:
                        result.lastSeenAt
                }
            )
        );
    }

    createSession(socket, message) {
        this.requireAuthenticated(socket);

        const target =
            this.security.inputValidator
                .validateSessionCreation(
                    message.payload
                ).target;

        this.security.gatewayGuard
            .validateSessionTarget(
                socket.nodeId,
                target
            );

        const targetSocket =
            this.nodes.get(target);

        if (
            !targetSocket ||
            targetSocket.readyState !==
                WebSocket.OPEN
        ) {
            throw new Error(
                "target_not_connected"
            );
        }

        const session =
            this.security
                .sessionLifecycleManager
                .createSession(
                    socket.nodeId,
                    target,
                    socket.accessToken
                );

        this.send(
            socket,
            createResponse(
                message.request_id,
                MESSAGE_TYPES.SESSION_CREATE,
                {
                    status: "created",
                    session_id:
                        session.sessionId,
                    state:
                        session.state,
                    expires_at:
                        session.expiresAt
                }
            )
        );

        this.send(
            targetSocket,
            createResponse(
                null,
                MESSAGE_TYPES.SESSION_CREATE,
                {
                    status: "incoming",
                    session_id:
                        session.sessionId,
                    initiator:
                        session.initiator,
                    target:
                        session.target,
                    state:
                        session.state,
                    expires_at:
                        session.expiresAt
                }
            )
        );
    }

    updateSessionState(
        socket,
        message
    ) {
        this.requireAuthenticated(socket);

        const data =
            this.security.inputValidator
                .validateSessionState(
                    message.payload
                );

        if (
            !Object.values(
                SESSION_STATES
            ).includes(data.state)
        ) {
            throw new Error(
                "invalid_session_state"
            );
        }

        const session =
            this.security
                .sessionLifecycleManager
                .updateSessionState(
                    data.sessionId,
                    socket.nodeId,
                    socket.accessToken,
                    data.state
                );

        this.send(
            socket,
            createResponse(
                message.request_id,
                MESSAGE_TYPES.SESSION_STATE,
                {
                    status: "updated",
                    session_id:
                        session.sessionId,
                    state:
                        session.state
                }
            )
        );

        const peerId =
            session.initiator ===
            socket.nodeId
                ? session.target
                : session.initiator;

        this.sendToNode(
            peerId,
            createResponse(
                null,
                MESSAGE_TYPES.SESSION_STATE,
                {
                    session_id:
                        session.sessionId,
                    state:
                        session.state
                }
            )
        );
    }

    closeSession(
        socket,
        message
    ) {
        this.requireAuthenticated(socket);

        const sessionId =
            this.security.inputValidator
                .validateSessionId(
                    message.payload?.session_id
                );

        const session =
            this.security
                .sessionLifecycleManager
                .closeSession(
                    sessionId,
                    socket.nodeId,
                    socket.accessToken
                );

        this.signalingService.removeSession(
            sessionId
        );

        this.send(
            socket,
            createResponse(
                message.request_id,
                MESSAGE_TYPES.SESSION_CLOSE,
                {
                    status: "closed",
                    session_id:
                        sessionId
                }
            )
        );

        const peerId =
            session.initiator ===
            socket.nodeId
                ? session.target
                : session.initiator;

        this.sendToNode(
            peerId,
            createResponse(
                null,
                MESSAGE_TYPES.SESSION_CLOSE,
                {
                    status: "closed",
                    session_id:
                        sessionId
                }
            )
        );
    }

    sendSignal(
        socket,
        message
    ) {
        this.requireAuthenticated(socket);

        const data =
            this.security.inputValidator
                .validateSignal(
                    message.payload
                );

        this.security.gatewayGuard
            .authorizeSession(
                data.sessionId,
                socket.nodeId,
                socket.accessToken
            );

        const signal =
            this.signalingService.send(
                data.sessionId,
                socket.nodeId,
                data.signalType,
                data.payload
            );

        const session =
            this.sessionManager.get(
                data.sessionId
            );

        const peerId =
            session.initiator ===
            socket.nodeId
                ? session.target
                : session.initiator;

        this.sendToNode(
            peerId,
            createResponse(
                null,
                MESSAGE_TYPES.SIGNAL_RECEIVE,
                signal
            )
        );

        this.send(
            socket,
            createResponse(
                message.request_id,
                MESSAGE_TYPES.SIGNAL_SEND,
                {
                    status: "accepted",
                    message_id:
                        signal.id
                }
            )
        );
    }

    receiveSignals(
        socket,
        message
    ) {
        this.requireAuthenticated(socket);

        const sessionId =
            this.security.inputValidator
                .validateSessionId(
                    message.payload?.session_id
                );

        this.security.gatewayGuard
            .authorizeSession(
                sessionId,
                socket.nodeId,
                socket.accessToken
            );

        const signals =
            this.signalingService.receive(
                sessionId,
                socket.nodeId
            );

        this.send(
            socket,
            createResponse(
                message.request_id,
                MESSAGE_TYPES.SIGNAL_RECEIVE,
                {
                    session_id:
                        sessionId,
                    signals
                }
            )
        );
    }

    requireAuthenticated(socket) {
        if (
            !socket.nodeId ||
            !socket.accessToken
        ) {
            throw new Error(
                "node_not_authenticated"
            );
        }

        if (
            !this.security
                .nodeLifecycleManager
                .validateNode(
                    socket.nodeId,
                    socket.accessToken
                )
        ) {
            throw new Error(
                "node_authentication_failed"
            );
        }
    }

    sendToNode(
        nodeId,
        message
    ) {
        const socket =
            this.nodes.get(nodeId);

        if (
            socket &&
            socket.readyState === WebSocket.OPEN
        ) {
            this.send(
                socket,
                message
            );
        }
    }

    send(
        socket,
        message
    ) {
        if (
            socket.readyState === WebSocket.OPEN
        ) {
            socket.send(
                JSON.stringify(message)
            );
        }
    }

    handleClose(socket) {
        if (!socket.nodeId) {
            return;
        }

        const current =
            this.nodes.get(
                socket.nodeId
            );

        if (current === socket) {
            this.nodes.delete(
                socket.nodeId
            );

            this.security.nodeLifecycleManager
                .revokeNode(
                    socket.nodeId
                );

            this.security.sessionLifecycleManager
                .removeNode(
                    socket.nodeId
                );
        }
    }

    getNodeCount() {
        return this.nodes.size;
    }
}
