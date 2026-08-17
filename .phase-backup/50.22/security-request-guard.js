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
            typeof inputValidator.nodeId !== "function" ||
            typeof inputValidator.sessionId !== "function" ||
            typeof inputValidator.accessToken !== "function"
        ) {
            throw new Error(
                "invalid_input_validator"
            );
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
            throw new Error(
                "invalid_rate_limiter"
            );
        }

        this.config = config;
        this.inputValidator = inputValidator;
        this.securityPolicyManager =
            securityPolicyManager;
        this.rateLimiter = rateLimiter;
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
            this.inputValidator.nodeId(nodeId);

        const validatedAccessToken =
            this.inputValidator.accessToken(
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
            this.inputValidator.sessionId(
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
            this.inputValidator.signalType(
                signalType
            );

        const validatedPayload =
            this.inputValidator.signalPayload(
                payload
            );

        return {
            ...request,
            signalType: validatedSignalType,
            payload: validatedPayload
        };
    }
}
