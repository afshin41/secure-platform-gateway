export class SecurityGatewayGuard {
    constructor(
        config,
        securityPolicyManager,
        securityInputValidator,
        securityReplayProtection,
        securityRateLimiter,
        securityNodeLifecycleManager,
        securitySessionLifecycleManager
    ) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        if (!securityPolicyManager) {
            throw new Error(
                "security_policy_manager_required"
            );
        }

        if (!securityInputValidator) {
            throw new Error(
                "security_input_validator_required"
            );
        }

        if (!securityReplayProtection) {
            throw new Error(
                "security_replay_protection_required"
            );
        }

        if (!securityRateLimiter) {
            throw new Error(
                "security_rate_limiter_required"
            );
        }

        if (!securityNodeLifecycleManager) {
            throw new Error(
                "security_node_lifecycle_manager_required"
            );
        }

        if (!securitySessionLifecycleManager) {
            throw new Error(
                "security_session_lifecycle_manager_required"
            );
        }

        this.config = config;
        this.securityPolicyManager =
            securityPolicyManager;
        this.securityInputValidator =
            securityInputValidator;
        this.securityReplayProtection =
            securityReplayProtection;
        this.securityRateLimiter =
            securityRateLimiter;
        this.securityNodeLifecycleManager =
            securityNodeLifecycleManager;
        this.securitySessionLifecycleManager =
            securitySessionLifecycleManager;
    }

    validateRequest(requestId, nodeId) {
        if (
            typeof requestId !== "string" ||
            requestId.length === 0
        ) {
            throw new Error(
                "invalid_request_id"
            );
        }

        if (
            typeof nodeId !== "string" ||
            nodeId.length === 0
        ) {
            throw new Error(
                "invalid_node_id"
            );
        }

        this.securityReplayProtection.register(
            requestId
        );

        this.securityRateLimiter.consume(
            nodeId
        );

        return true;
    }

    authenticateNode(
        nodeId,
        enrollmentToken
    ) {
        const validatedNodeId =
            this.securityInputValidator.validateNodeId(
                nodeId
            );

        const validatedToken =
            this.securityInputValidator
                .validateEnrollmentToken(
                    enrollmentToken
                );

        return this.securityNodeLifecycleManager
            .registerNode(
                validatedNodeId,
                validatedToken
            );
    }

    authorizeNode(
        nodeId,
        accessToken
    ) {
        const validatedNodeId =
            this.securityInputValidator.validateNodeId(
                nodeId
            );

        const validatedToken =
            this.securityInputValidator
                .validateAccessToken(
                    accessToken
                );

        if (
            !this.securityNodeLifecycleManager
                .validateNode(
                    validatedNodeId,
                    validatedToken
                )
        ) {
            throw new Error(
                "node_authentication_failed"
            );
        }

        return true;
    }

    authorizeSession(
        sessionId,
        nodeId,
        accessToken
    ) {
        const validatedSessionId =
            this.securityInputValidator
                .validateSessionId(
                    sessionId
                );

        const validatedNodeId =
            this.securityInputValidator.validateNodeId(
                nodeId
            );

        const validatedToken =
            this.securityInputValidator
                .validateAccessToken(
                    accessToken
                );

        return this.securitySessionLifecycleManager
            .validateSessionParticipant(
                validatedSessionId,
                validatedNodeId,
                validatedToken
            );
    }

    validateSessionTarget(
        nodeId,
        targetNodeId
    ) {
        const validatedNodeId =
            this.securityInputValidator.validateNodeId(
                nodeId
            );

        const validatedTarget =
            this.securityInputValidator
                .validateSessionTarget(
                    targetNodeId
                );

        this.securityPolicyManager.preventSelfSession(
            validatedNodeId,
            validatedTarget
        );

        return {
            nodeId: validatedNodeId,
            targetNodeId: validatedTarget
        };
    }
}
