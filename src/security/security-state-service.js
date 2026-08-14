export class SecurityStateService {
    constructor(securityManager) {
        this.securityManager = securityManager;
    }

    getNodeState(nodeId) {
        if (
            typeof nodeId !== "string" ||
            nodeId.length === 0
        ) {
            throw new Error("invalid_node_id");
        }

        return (
            this.securityManager.getSecurityState(
                nodeId
            ) || {
                nodeId,
                state: "unknown"
            }
        );
    }

    isAuthenticated(nodeId) {
        const state =
            this.getNodeState(nodeId);

        return state.state === "authenticated";
    }

    isRevoked(nodeId) {
        const state =
            this.getNodeState(nodeId);

        return state.state === "revoked";
    }
}
