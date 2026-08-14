export class SecurityNodeLifecycleManager {
    constructor(
        config,
        securityManager,
        authenticationManager
    ) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        if (!securityManager) {
            throw new Error("security_manager_required");
        }

        if (!authenticationManager) {
            throw new Error(
                "authentication_manager_required"
            );
        }

        this.config = config;
        this.securityManager = securityManager;
        this.authenticationManager =
            authenticationManager;

        this.nodes = new Map();
    }

    registerNode(
        nodeId,
        enrollmentToken
    ) {
        if (
            typeof nodeId !== "string" ||
            nodeId.length === 0
        ) {
            throw new Error("invalid_node_id");
        }

        const authentication =
            this.securityManager.authenticateNode(
                nodeId,
                enrollmentToken
            );

        const now = Date.now();

        const record = {
            nodeId,
            authenticatedAt: now,
            lastSeenAt: now,
            accessToken:
                authentication.accessToken,
            issuedAt:
                authentication.issuedAt
        };

        this.nodes.set(
            nodeId,
            record
        );

        return {
            nodeId,
            accessToken:
                authentication.accessToken,
            authenticatedAt: now
        };
    }

    validateNode(
        nodeId,
        accessToken
    ) {
        const record =
            this.nodes.get(nodeId);

        if (!record) {
            return false;
        }

        if (
            !this.securityManager.validateAccessToken(
                nodeId,
                accessToken
            )
        ) {
            return false;
        }

        record.lastSeenAt = Date.now();

        return true;
    }

    refreshNode(
        nodeId,
        accessToken
    ) {
        if (
            !this.validateNode(
                nodeId,
                accessToken
            )
        ) {
            throw new Error(
                "node_authentication_failed"
            );
        }

        const record =
            this.nodes.get(nodeId);

        record.lastSeenAt = Date.now();

        return {
            nodeId,
            lastSeenAt:
                record.lastSeenAt
        };
    }

    revokeNode(nodeId) {
        this.securityManager.revokeNode(
            nodeId
        );

        this.nodes.delete(nodeId);

        return true;
    }

    revokeAll() {
        this.securityManager.revokeAll();
        this.nodes.clear();
    }

    hasNode(nodeId) {
        return this.nodes.has(nodeId);
    }

    count() {
        return this.nodes.size;
    }

    getNode(nodeId) {
        const record =
            this.nodes.get(nodeId);

        if (!record) {
            return null;
        }

        return {
            ...record
        };
    }
}
