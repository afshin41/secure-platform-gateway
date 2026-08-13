export const MESSAGE_TYPES = Object.freeze({
    NODE_REGISTER: "node.register",
    NODE_REFRESH: "node.refresh",

    SESSION_CREATE: "session.create",
    SESSION_STATE: "session.state",
    SESSION_CLOSE: "session.close",

    SIGNAL_SEND: "signal.send",
    SIGNAL_RECEIVE: "signal.receive",

    ERROR: "error"
});

export const SESSION_STATES = Object.freeze({
    CREATED: "created",
    SIGNALING: "signaling",
    CONNECTING: "connecting",
    CONNECTED: "connected",
    CLOSING: "closing",
    CLOSED: "closed"
});

export function createResponse(requestId, type, payload = {}) {
    return {
        version: 1,
        request_id: requestId ?? null,
        type,
        payload
    };
}

export function createError(
    requestId,
    code,
    message
) {
    return createResponse(
        requestId,
        MESSAGE_TYPES.ERROR,
        {
            code,
            message
        }
    );
}

export function parseMessage(raw) {
    let message;

    try {
        message = JSON.parse(raw);
    } catch {
        throw new Error("invalid_json");
    }

    if (
        message === null ||
        typeof message !== "object" ||
        Array.isArray(message)
    ) {
        throw new Error("invalid_message");
    }

    if (
        message.version !== 1 ||
        typeof message.type !== "string" ||
        message.type.length === 0
    ) {
        throw new Error("invalid_protocol");
    }

    return message;
}
