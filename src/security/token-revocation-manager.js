export class TokenRevocationManager {
    constructor() {
        this.revokedNodes = new Map();
    }

    revoke(nodeId, reason = "manual") {
        if (
            typeof nodeId !== "string" ||
            nodeId.length === 0
        ) {
            throw new Error("invalid_node_id");
        }

        this.revokedNodes.set(
            nodeId,
            {
                nodeId,
                reason:
                    typeof reason === "string" &&
                    reason.length > 0
                        ? reason
                        : "manual",
                revokedAt: Date.now()
            }
        );
    }

    isRevoked(nodeId) {
        return this.revokedNodes.has(nodeId);
    }

    get(nodeId) {
        return (
            this.revokedNodes.get(nodeId) ||
            null
        );
    }

    restore(nodeId) {
        this.revokedNodes.delete(nodeId);
    }

    clear() {
        this.revokedNodes.clear();
    }

    count() {
        return this.revokedNodes.size;
    }
}
