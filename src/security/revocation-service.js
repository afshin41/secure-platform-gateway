export class RevocationService {
    constructor(securityManager) {
        this.securityManager = securityManager;
    }

    revokeNode(nodeId, reason = "manual") {
        if (
            typeof nodeId !== "string" ||
            nodeId.length === 0
        ) {
            throw new Error("invalid_node_id");
        }

        this.securityManager.revokeNode(
            nodeId,
            reason
        );

        return {
            node_id: nodeId,
            revoked: true,
            reason
        };
    }

    isRevoked(nodeId) {
        return this.securityManager.isRevoked(
            nodeId
        );
    }
}
