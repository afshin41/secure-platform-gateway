export class AuthenticatedNodeRegistry {
    constructor(config, authenticationManager) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        if (
            !authenticationManager ||
            typeof authenticationManager.validate !== "function"
        ) {
            throw new Error(
                "invalid_authentication_manager"
            );
        }

        this.config = config;
        this.authenticationManager =
            authenticationManager;

        this.nodes = new Map();
    }

    register(
        nodeId,
        accessToken,
        metadata = {}
    ) {
        if (
            typeof nodeId !== "string" ||
            nodeId.length === 0 ||
            nodeId.length > 128
        ) {
            throw new Error("invalid_node_id");
        }

        if (
            !this.authenticationManager.validate(
                nodeId,
                accessToken
            )
        ) {
            throw new Error(
                "invalid_access_token"
            );
        }

        const existing = this.nodes.get(nodeId);

        if (existing) {
            throw new Error(
                "node_already_registered"
            );
        }

        if (
            this.nodes.size >= this.config.maxNodes
        ) {
            throw new Error(
                "node_capacity_reached"
            );
        }

        const registeredAt = Date.now();

        const node = {
            nodeId,
            metadata:
                metadata &&
                typeof metadata === "object" &&
                !Array.isArray(metadata)
                    ? { ...metadata }
                    : {},
            registeredAt,
            lastSeenAt: registeredAt
        };

        this.nodes.set(nodeId, node);

        return {
            ...node
        };
    }

    get(nodeId) {
        const node = this.nodes.get(nodeId);

        if (!node) {
            return null;
        }

        return {
            ...node,
            metadata: {
                ...node.metadata
            }
        };
    }

    require(nodeId, accessToken) {
        if (
            !this.authenticationManager.validate(
                nodeId,
                accessToken
            )
        ) {
            throw new Error(
                "invalid_access_token"
            );
        }

        const node = this.nodes.get(nodeId);

        if (!node) {
            throw new Error(
                "node_not_registered"
            );
        }

        return node;
    }

    touch(nodeId, accessToken) {
        const node =
            this.require(
                nodeId,
                accessToken
            );

        node.lastSeenAt = Date.now();

        return {
            ...node
        };
    }

    unregister(nodeId, accessToken) {
        this.require(
            nodeId,
            accessToken
        );

        this.nodes.delete(nodeId);
    }

    has(nodeId) {
        return this.nodes.has(nodeId);
    }

    count() {
        return this.nodes.size;
    }

    clear() {
        this.nodes.clear();
    }
}
