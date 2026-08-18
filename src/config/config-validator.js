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

const requireValidEnvironment = (value) => {
    if (
        value !== "development" &&
        value !== "test" &&
        value !== "production"
    ) {
        throw new Error(
            "invalid_configuration:environment"
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

    requireValidEnvironment(
        config.environment
    );

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

    requirePositiveInteger(
        config.securityRateWindowMs,
        "securityRateWindowMs"
    );

    requirePositiveInteger(
        config.securityRateMaxRequests,
        "securityRateMaxRequests"
    );

    requirePositiveInteger(
        config.maxWebSocketConnections,
        "maxWebSocketConnections"
    );

    requirePositiveInteger(
        config.httpRequestTimeoutMs,
        "httpRequestTimeoutMs"
    );

    requirePositiveInteger(
        config.httpHeadersTimeoutMs,
        "httpHeadersTimeoutMs"
    );

    requirePositiveInteger(
        config.httpKeepAliveTimeoutMs,
        "httpKeepAliveTimeoutMs"
    );

    requirePositiveInteger(
        config.shutdownTimeoutMs,
        "shutdownTimeoutMs"
    );

    requireNonEmptyString(
        config.persistencePath,
        "persistencePath"
    );

    if (
        config.maxWebSocketConnections >
        config.maxNodes
    ) {
        throw new Error(
            "invalid_configuration:maxWebSocketConnections"
        );
    }

    if (
        config.httpHeadersTimeoutMs >
        config.httpRequestTimeoutMs
    ) {
        throw new Error(
            "invalid_configuration:httpHeadersTimeoutMs"
        );
    }

    requireNonEmptyString(
        config.serverName,
        "serverName"
    );

    requireNonEmptyString(
        config.serverVersion,
        "serverVersion"
    );

    if (
        config.enrollmentToken !== undefined &&
        typeof config.enrollmentToken !== "string"
    ) {
        throw new Error(
            "invalid_configuration:enrollmentToken"
        );
    }

    return true;
};
