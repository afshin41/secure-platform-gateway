export class SecurityPolicyManager {
    constructor(config) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        this.config = config;

        this.policies = Object.freeze({
            authenticationRequired: true,
            accessTokenRequired: true,
            sessionAuthorizationRequired: true,
            signalingAuthorizationRequired: true,
            selfSessionForbidden: true,
            unregisteredNodeForbidden: true
        });
    }

    getPolicy(name) {
        if (
            typeof name !== "string" ||
            name.length === 0
        ) {
            throw new Error("invalid_policy_name");
        }

        if (!(name in this.policies)) {
            throw new Error("unknown_security_policy");
        }

        return this.policies[name];
    }

    requireAuthentication() {
        if (!this.policies.authenticationRequired) {
            throw new Error(
                "authentication_policy_disabled"
            );
        }

        return true;
    }

    requireAccessToken() {
        if (!this.policies.accessTokenRequired) {
            throw new Error(
                "access_token_policy_disabled"
            );
        }

        return true;
    }

    requireSessionAuthorization() {
        if (
            !this.policies.sessionAuthorizationRequired
        ) {
            throw new Error(
                "session_authorization_policy_disabled"
            );
        }

        return true;
    }

    requireSignalingAuthorization() {
        if (
            !this.policies.signalingAuthorizationRequired
        ) {
            throw new Error(
                "signaling_authorization_policy_disabled"
            );
        }

        return true;
    }

    requireRegisteredNode() {
        if (
            !this.policies.unregisteredNodeForbidden
        ) {
            return true;
        }

        return true;
    }

    preventSelfSession(
        initiatorNodeId,
        targetNodeId
    ) {
        if (
            typeof initiatorNodeId !== "string" ||
            typeof targetNodeId !== "string"
        ) {
            throw new Error(
                "invalid_node_id"
            );
        }

        if (
            this.policies.selfSessionForbidden &&
            initiatorNodeId === targetNodeId
        ) {
            throw new Error(
                "invalid_self_session"
            );
        }

        return true;
    }

    getAllPolicies() {
        return {
            ...this.policies
        };
    }
}
