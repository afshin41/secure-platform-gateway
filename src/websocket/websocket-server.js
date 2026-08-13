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
        signalingService
    ) {
        this.config = config;
        this.sessionManager = sessionManager;
        this.signalingService = signalingService;

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
            message = parseMessage(raw.toString());
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
            switch (message.type) {
                case MESSAGE_TYPES.NODE_REGISTER:
                    this.registerNode(socket, message);
                    break;

                case MESSAGE_TYPES.NODE_REFRESH:
                    this.refreshNode(socket, message);
                    break;

                case MESSAGE_TYPES.SESSION_CREATE:
                    this.createSession(socket, message);
                    break;

                case MESSAGE_TYPES.SESSION_STATE:
                    this.updateSessionState(socket, message);
                    break;

                case MESSAGE_TYPES.SESSION_CLOSE:
                    this.closeSession(socket, message);
                    break;

                case MESSAGE_TYPES.SIGNAL_SEND:
                    this.sendSignal(socket, message);
                    break;

                case MESSAGE_TYPES.SIGNAL_RECEIVE:
                    this.receiveSignals(socket, message);
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
        const {
            node_id,
            device_name,
            node_type
        } = message.payload || {};

        if (
            typeof node_id !== "string" ||
            node_id.length === 0 ||
            node_id.length > 128
        ) {
            throw new Error("invalid_node_id");
        }

        const existing = this.nodes.get(node_id);

        if (
            existing &&
            existing !== socket &&
            existing.readyState === WebSocket.OPEN
        ) {
            throw new Error("node_already_connected");
        }

        if (
            this.nodes.size >= this.config.maxNodes &&
            !existing
        ) {
            throw new Error("node_capacity_reached");
        }

        socket.nodeId = node_id;

        this.nodes.set(node_id, socket);

        socket.nodeExpiresAt =
            Date.now() +
            this.config.nodeTtlSeconds * 1000;

        this.send(
            socket,
            createResponse(
                message.request_id,
                MESSAGE_TYPES.NODE_REGISTER,
                {
                    status: "registered",
                    node_id,
                    device_name:
                        typeof device_name === "string"
                            ? device_name
                            : "",
                    node_type:
                        typeof node_type === "string"
                            ? node_type
                            : "device",
                    expires_at: socket.nodeExpiresAt
                }
            )
        );
    }

    refreshNode(socket, message) {
        this.requireRegistered(socket);

        socket.nodeExpiresAt =
            Date.now() +
            this.config.nodeTtlSeconds * 1000;

        this.send(
            socket,
            createResponse(
                message.request_id,
                MESSAGE_TYPES.NODE_REFRESH,
                {
                    status: "refreshed",
                    node_id: socket.nodeId,
                    expires_at: socket.nodeExpiresAt
                }
            )
        );
    }

    createSession(socket, message) {
        this.requireRegistered(socket);

        const {
            target
        } = message.payload || {};

        if (
            typeof target !== "string" ||
            target.length === 0
        ) {
            throw new Error("target_required");
        }

        if (target === socket.nodeId) {
            throw new Error("invalid_session");
        }

        const targetSocket = this.nodes.get(target);

        if (
            !targetSocket ||
            targetSocket.readyState !== WebSocket.OPEN
        ) {
            throw new Error("target_not_connected");
        }

        const session =
            this.sessionManager.create(
                socket.nodeId,
                target
            );

        this.send(
            socket,
            createResponse(
                message.request_id,
                MESSAGE_TYPES.SESSION_CREATE,
                {
                    status: "created",
                    session_id: session.sessionId,
                    state: session.state,
                    expires_at: session.expiresAt
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
                    session_id: session.sessionId,
                    initiator: session.initiator,
                    target: session.target,
                    state: session.state,
                    expires_at: session.expiresAt
                }
            )
        );
    }

    updateSessionState(socket, message) {
        this.requireRegistered(socket);

        const {
            session_id,
            state
        } = message.payload || {};

        if (
            typeof session_id !== "string" ||
            typeof state !== "string"
        ) {
            throw new Error(
                "session_id_and_state_required"
            );
        }

        if (
            !Object.values(SESSION_STATES).includes(state)
        ) {
            throw new Error("invalid_session_state");
        }

        const session =
            this.sessionManager.updateState(
                session_id,
                socket.nodeId,
                state
            );

        this.send(
            socket,
            createResponse(
                message.request_id,
                MESSAGE_TYPES.SESSION_STATE,
                {
                    status: "updated",
                    session_id: session.sessionId,
                    state: session.state
                }
            )
        );

        const peerId =
            session.initiator === socket.nodeId
                ? session.target
                : session.initiator;

        this.sendToNode(
            peerId,
            createResponse(
                null,
                MESSAGE_TYPES.SESSION_STATE,
                {
                    session_id: session.sessionId,
                    state: session.state
                }
            )
        );
    }

    closeSession(socket, message) {
        this.requireRegistered(socket);

        const {
            session_id
        } = message.payload || {};

        if (typeof session_id !== "string") {
            throw new Error("session_id_required");
        }

        const session =
            this.sessionManager.close(
                session_id,
                socket.nodeId
            );

        this.signalingService.removeSession(
            session_id
        );

        this.send(
            socket,
            createResponse(
                message.request_id,
                MESSAGE_TYPES.SESSION_CLOSE,
                {
                    status: "closed",
                    session_id
                }
            )
        );

        const peerId =
            session.initiator === socket.nodeId
                ? session.target
                : session.initiator;

        this.sendToNode(
            peerId,
            createResponse(
                null,
                MESSAGE_TYPES.SESSION_CLOSE,
                {
                    status: "closed",
                    session_id
                }
            )
        );
    }

    sendSignal(socket, message) {
        this.requireRegistered(socket);

        const {
            session_id,
            signal_type,
            payload
        } = message.payload || {};

        if (
            typeof session_id !== "string" ||
            typeof signal_type !== "string" ||
            payload === undefined
        ) {
            throw new Error(
                "session_id_signal_type_and_payload_required"
            );
        }

        const signal =
            this.signalingService.send(
                session_id,
                socket.nodeId,
                signal_type,
                payload
            );

        const session =
            this.sessionManager.get(session_id);

        const peerId =
            session.initiator === socket.nodeId
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
                    message_id: signal.id
                }
            )
        );
    }

    receiveSignals(socket, message) {
        this.requireRegistered(socket);

        const {
            session_id
        } = message.payload || {};

        if (typeof session_id !== "string") {
            throw new Error("session_id_required");
        }

        const signals =
            this.signalingService.receive(
                session_id,
                socket.nodeId
            );

        this.send(
            socket,
            createResponse(
                message.request_id,
                MESSAGE_TYPES.SIGNAL_RECEIVE,
                {
                    session_id,
                    signals
                }
            )
        );
    }

    requireRegistered(socket) {
        if (
            !socket.nodeId ||
            socket.nodeExpiresAt <= Date.now()
        ) {
            throw new Error("node_not_registered");
        }
    }

    sendToNode(nodeId, message) {
        const socket = this.nodes.get(nodeId);

        if (
            socket &&
            socket.readyState === WebSocket.OPEN
        ) {
            this.send(socket, message);
        }
    }

    send(socket, message) {
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
            this.nodes.get(socket.nodeId);

        if (current === socket) {
            this.nodes.delete(socket.nodeId);
            this.sessionManager.removeNode(
                socket.nodeId
            );
        }
    }

    getNodeCount() {
        return this.nodes.size;
    }
}
