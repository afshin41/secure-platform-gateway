export class NodeAuthorizationManager {
    constructor(
        config,
        authenticationManager,
        authenticatedNodeRegistry
    ) {
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

        if (
            !authenticatedNodeRegistry ||
            typeof authenticatedNodeRegistry.require !== "function"
        ) {
            throw new Error(
                "invalid_node_registry"
            );
        }

        this.config = config;

        this.authenticationManager =
            authenticationManager;

        this.authenticatedNodeRegistry =
            authenticatedNodeRegistry;
    }

    authorize(nodeId, accessToken) {
        if (
            !this.authenticationManager.validate(
                nodeId,
                accessToken
            )
        ) {
            throw new Error(
                "authentication_required"
            );
        }

        return this.authenticatedNodeRegistry.require(
            nodeId,
            accessToken
        );
    }

    authorizeParticipant(
        nodeId,
        accessToken,
        session
    ) {
        if (!session || typeof session !== "object") {
            throw new Error("invalid_session");
        }

        const node =
            this.authorize(
                nodeId,
                accessToken
            );

        if (
            session.initiator !== nodeId &&
            session.target !== nodeId
        ) {
            throw new Error(
                "node_not_participant"
            );
        }

        return node;
    }

    authorizeTarget(
        nodeId,
        accessToken,
        targetNodeId
    ) {
        const node =
            this.authorize(
                nodeId,
                accessToken
            );

        if (
            typeof targetNodeId !== "string" ||
            targetNodeId.length === 0
        ) {
            throw new Error(
                "invalid_target_node_id"
            );
        }

        if (nodeId === targetNodeId) {
            throw new Error(
                "invalid_target_node"
            );
        }

        const target =
            this.authenticatedNodeRegistry.get(
                targetNodeId
            );

        if (!target) {
            throw new Error(
                "target_not_registered"
            );
        }

        return {
            node,
            target
        };
    }

    isAuthenticated(
        nodeId,
        accessToken
    ) {
        return this.authenticationManager.validate(
            nodeId,
            accessToken
        );
    }
}
