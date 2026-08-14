import { SecurityManager } from "./security-manager.js";

export class AuthenticationManager {
    constructor(config) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        this.config = config;
        this.securityManager =
            new SecurityManager(config);
    }

    authenticate(nodeId, enrollmentToken) {
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

    validate(nodeId, accessToken) {
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
