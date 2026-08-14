const requirePositiveInteger = (value, name) => {
    if (
        !Number.isInteger(value) ||
        value <= 0
    ) {
        throw new Error(
            `invalid_configuration:${name}`
        );
    }
};

const requireNonEmptyString = (value, name) => {
    if (
        typeof value !== "string" ||
        value.length === 0
    ) {
        throw new Error(
            `invalid_configuration:${name}`
        );
    }
};

export const validateConfig = (config) => {
    if (
        !config ||
        typeof config !== "object"
    ) {
        throw new Error(
            "invalid_configuration:config"
        );
    }

    requireNonEmptyString(
        config.host,
        "host"
    );

    requirePositiveInteger(
        config.port,
        "port"
    );

    requirePositiveInteger(
        config.nodeTtlSeconds,
        "nodeTtlSeconds"
    );

    requirePositiveInteger(
        config.sessionTtlSeconds,
        "sessionTtlSeconds"
    );

    requirePositiveInteger(
        config.maxNodes,
        "maxNodes"
    );

    requirePositiveInteger(
        config.maxSessions,
        "maxSessions"
    );

    requirePositiveInteger(
        config.maxMessageBytes,
        "maxMessageBytes"
    );

    requireNonEmptyString(
        config.serverName,
        "serverName"
    );

    requireNonEmptyString(
        config.serverVersion,
        "serverVersion"
    );

    return true;
};
