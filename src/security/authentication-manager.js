export class AuthenticationManager {
    constructor(
        config,
        securityManager
    ) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        if (
            !securityManager ||
            typeof securityManager.authenticateNode !== "function" ||
            typeof securityManager.validateAccessToken !== "function" ||
            typeof securityManager.revokeNode !== "function" ||
            typeof securityManager.revokeAll !== "function" ||
            typeof securityManager.count !== "function"
        ) {
            throw new Error(
                "invalid_security_manager"
            );
        }

        this.config = config;
        this.securityManager = securityManager;
    }

    authenticate(
        nodeId,
        enrollmentToken
    ) {
        const result =
            this.securityManager.authenticateNode(
                nodeId,
                enrollmentToken
            );

        return {
            nodeId,
            accessToken: result.accessToken,
            issuedAt: result.issuedAt
        };
    }

    validate(
        nodeId,
        accessToken
    ) {
        return this.securityManager.validateAccessToken(
            nodeId,
            accessToken
        );
    }

    revoke(nodeId) {
        if (
            typeof nodeId !== "string" ||
            nodeId.length === 0
        ) {
            throw new Error("invalid_node_id");
        }

        this.securityManager.revokeNode(nodeId);
    }

    revokeAll() {
        this.securityManager.revokeAll();
    }

    count() {
        return this.securityManager.count();
    }
}
