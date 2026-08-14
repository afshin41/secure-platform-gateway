export class SecurityPolicyManager {
    constructor(config) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        this.config = config;

        this.policies = Object.freeze({
            authenticationRequired: true,
            accessTokenRequired: true,
            registeredNodeRequired: true,
            sessionAuthorizationRequired: true,
            signalingAuthorizationRequired: true,
            selfSessionForbidden: true
        });
    }

    requireAuthentication() {
        if (!this.policies.authenticationRequired) {
            return true;
        }

        return true;
    }

    requireAccessToken() {
        if (!this.policies.accessTokenRequired) {
            return true;
        }

        return true;
    }

    requireRegisteredNode() {
        if (!this.policies.registeredNodeRequired) {
            return true;
        }

        return true;
    }

    requireSessionAuthorization() {
        if (!this.policies.sessionAuthorizationRequired) {
            return true;
        }

        return true;
    }

    requireSignalingAuthorization() {
        if (!this.policies.signalingAuthorizationRequired) {
            return true;
        }

        return true;
    }

    preventSelfSession(
        nodeId,
        targetNodeId
    ) {
        if (
            typeof nodeId !== "string" ||
            typeof targetNodeId !== "string"
        ) {
            throw new Error(
                "invalid_session_participants"
            );
        }

        if (
            this.policies.selfSessionForbidden &&
            nodeId === targetNodeId
        ) {
            throw new Error(
                "self_session_forbidden"
            );
        }

        return true;
    }

    getPolicies() {
        return {
            ...this.policies
        };
    }
}
