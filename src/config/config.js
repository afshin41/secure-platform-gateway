const positiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        return fallback;
    }

    return parsed;
};

export const config = Object.freeze({
    host: process.env.HOST || "0.0.0.0",

    port: positiveInteger(
        process.env.PORT,
        10000
    ),

    nodeTtlSeconds: positiveInteger(
        process.env.NODE_TTL,
        120
    ),

    sessionTtlSeconds: positiveInteger(
        process.env.SESSION_TTL,
        300
    ),

    maxNodes: positiveInteger(
        process.env.MAX_NODES,
        10000
    ),

    maxSessions: positiveInteger(
        process.env.MAX_SESSIONS,
        10000
    ),

    maxMessageBytes: positiveInteger(
        process.env.MAX_MESSAGE_BYTES,
        1024 * 1024
    ),

    serverName: "Secure Platform Gateway",

    serverVersion: "1.0.0"
});
