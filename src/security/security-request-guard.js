export class SecurityRequestGuard {
    constructor(
        config,
        inputValidator,
        securityPolicyManager,
        rateLimiter
    ) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        if (
            !inputValidator ||
            (
                typeof inputValidator.validateNodeId !== "function" &&
                typeof inputValidator.nodeId !== "function"
            ) ||
            (
                typeof inputValidator.validateSessionId !== "function" &&
                typeof inputValidator.sessionId !== "function"
            ) ||
            (
                typeof inputValidator.validateAccessToken !== "function" &&
                typeof inputValidator.accessToken !== "function"
            )
        ) {
            throw new Error("invalid_input_validator");
        }

        if (
            !securityPolicyManager ||
            typeof securityPolicyManager.requireAuthentication !== "function" ||
            typeof securityPolicyManager.requireAccessToken !== "function" ||
            typeof securityPolicyManager.requireRegisteredNode !== "function"
        ) {
            throw new Error(
                "invalid_security_policy_manager"
            );
        }

        if (
            !rateLimiter ||
            typeof rateLimiter.consume !== "function"
        ) {
            throw new Error("invalid_rate_limiter");
        }

        this.config = config;
        this.inputValidator = inputValidator;
        this.securityPolicyManager =
            securityPolicyManager;
        this.rateLimiter = rateLimiter;
    }

    validateNodeId(nodeId) {
        if (
            typeof this.inputValidator.validateNodeId ===
            "function"
        ) {
            return this.inputValidator.validateNodeId(
                nodeId
            );
        }

        return this.inputValidator.nodeId(nodeId);
    }

    validateAccessToken(accessToken) {
        if (
            typeof this.inputValidator.validateAccessToken ===
            "function"
        ) {
            return this.inputValidator.validateAccessToken(
                accessToken
            );
        }

        return this.inputValidator.accessToken(
            accessToken
        );
    }

    validateSessionId(sessionId) {
        if (
            typeof this.inputValidator.validateSessionId ===
            "function"
        ) {
            return this.inputValidator.validateSessionId(
                sessionId
            );
        }

        return this.inputValidator.sessionId(
            sessionId
        );
    }

    validateSignalType(signalType) {
        if (
            typeof this.inputValidator.validateSignalType ===
            "function"
        ) {
            return this.inputValidator.validateSignalType(
                signalType
            );
        }

        if (
            typeof this.inputValidator.signalType ===
            "function"
        ) {
            return this.inputValidator.signalType(
                signalType
            );
        }

        throw new Error("invalid_signal_type");
    }

    validateSignalPayload(payload) {
        if (
            typeof this.inputValidator.validateSignalPayload ===
            "function"
        ) {
            return this.inputValidator.validateSignalPayload(
                payload
            );
        }

        if (
            typeof this.inputValidator.signalPayload ===
            "function"
        ) {
            return this.inputValidator.signalPayload(
                payload
            );
        }

        throw new Error("invalid_signal_payload");
    }

    validateNodeRequest(
        nodeId,
        accessToken
    ) {
        this.securityPolicyManager
            .requireAuthentication();

        this.securityPolicyManager
            .requireAccessToken();

        const validatedNodeId =
            this.validateNodeId(nodeId);

        const validatedAccessToken =
            this.validateAccessToken(
                accessToken
            );

        this.rateLimiter.consume(
            `node:${validatedNodeId}`
        );

        return {
            nodeId: validatedNodeId,
            accessToken: validatedAccessToken
        };
    }

    validateSessionRequest(
        nodeId,
        accessToken,
        sessionId
    ) {
        const request =
            this.validateNodeRequest(
                nodeId,
                accessToken
            );

        const validatedSessionId =
            this.validateSessionId(
                sessionId
            );

        return {
            ...request,
            sessionId: validatedSessionId
        };
    }

    validateSignalRequest(
        nodeId,
        accessToken,
        sessionId,
        signalType,
        payload
    ) {
        const request =
            this.validateSessionRequest(
                nodeId,
                accessToken,
                sessionId
            );

        const validatedSignalType =
            this.validateSignalType(
                signalType
            );

        const validatedPayload =
            this.validateSignalPayload(
                payload
            );

        return {
            ...request,
            signalType: validatedSignalType,
            payload: validatedPayload
        };
    }
}
