const DEFAULTS = Object.freeze({
    host: "0.0.0.0",
    port: 10000,
    nodeTtlSeconds: 120,
    sessionTtlSeconds: 300,
    maxNodes: 10000,
    maxSessions: 10000,
    maxMessageBytes: 1024 * 1024,
    environment: "production"
});

const parsePositiveInteger = (value, name, fallback) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (!/^[0-9]+$/.test(value)) {
        throw new Error(
            `invalid_environment_variable:${name}`
        );
    }

    const parsed = Number(value);

    if (
        !Number.isSafeInteger(parsed) ||
        parsed <= 0
    ) {
        throw new Error(
            `invalid_environment_variable:${name}`
        );
    }

    return parsed;
};

const parseNonEmptyString = (value, name, fallback) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (typeof value !== "string") {
        throw new Error(
            `invalid_environment_variable:${name}`
        );
    }

    return value;
};

const parseEnvironment = (value) => {
    const environment =
        value === undefined || value === ""
            ? DEFAULTS.environment
            : value;

    if (
        environment !== "development" &&
        environment !== "test" &&
        environment !== "production"
    ) {
        throw new Error(
            "invalid_environment_variable:NODE_ENV"
        );
    }

    return environment;
};

export const config = Object.freeze({
    environment: parseEnvironment(
        process.env.NODE_ENV
    ),

    host: parseNonEmptyString(
        process.env.HOST,
        "HOST",
        DEFAULTS.host
    ),

    port: parsePositiveInteger(
        process.env.PORT,
        "PORT",
        DEFAULTS.port
    ),

    nodeTtlSeconds: parsePositiveInteger(
        process.env.NODE_TTL,
        "NODE_TTL",
        DEFAULTS.nodeTtlSeconds
    ),

    sessionTtlSeconds: parsePositiveInteger(
        process.env.SESSION_TTL,
        "SESSION_TTL",
        DEFAULTS.sessionTtlSeconds
    ),

    maxNodes: parsePositiveInteger(
        process.env.MAX_NODES,
        "MAX_NODES",
        DEFAULTS.maxNodes
    ),

    maxSessions: parsePositiveInteger(
        process.env.MAX_SESSIONS,
        "MAX_SESSIONS",
        DEFAULTS.maxSessions
    ),

    maxMessageBytes: parsePositiveInteger(
        process.env.MAX_MESSAGE_BYTES,
        "MAX_MESSAGE_BYTES",
        DEFAULTS.maxMessageBytes
    ),

    enrollmentToken:
        process.env.GATEWAY_ENROLLMENT_TOKEN || "",

    serverName: "Secure Platform Gateway",

    serverVersion: "1.0.0"
});
