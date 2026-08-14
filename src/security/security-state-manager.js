export class SecurityStateManager {
    constructor() {
        this.states = new Map();
    }

    setState(nodeId, state) {
        if (
            typeof nodeId !== "string" ||
            nodeId.length === 0
        ) {
            throw new Error("invalid_node_id");
        }

        if (
            typeof state !== "string" ||
            state.length === 0
        ) {
            throw new Error("invalid_security_state");
        }

        this.states.set(nodeId, {
            nodeId,
            state,
            updatedAt: Date.now()
        });
    }

    getState(nodeId) {
        const record =
            this.states.get(nodeId);

        return record
            ? { ...record }
            : null;
    }

    hasState(nodeId, state) {
        const record =
            this.states.get(nodeId);

        return !!record &&
            record.state === state;
    }

    removeState(nodeId) {
        this.states.delete(nodeId);
    }

    clear() {
        this.states.clear();
    }

    count() {
        return this.states.size;
    }
}
