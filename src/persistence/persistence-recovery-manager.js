import { PersistenceError } from "./persistence-error.js";

const RECOVERY_KEY = "gateway-recovery";

export class PersistenceRecoveryManager {
    constructor(persistenceManager) {
        if (
            !persistenceManager ||
            typeof persistenceManager.initialize !== "function" ||
            !persistenceManager.repository ||
            typeof persistenceManager.repository.save !== "function" ||
            typeof persistenceManager.repository.load !== "function"
        ) {
            throw new Error("invalid_persistence_manager");
        }

        this.persistence = persistenceManager;
    }

    async initialize() {
        await this.persistence.initialize();

        if (!this.persistence.initialized) {
            throw new Error("persistence_initialization_failed");
        }

        return true;
    }

    async save(state) {
        if (!this.persistence.initialized) {
            throw new Error("persistence_not_initialized");
        }

        if (!state || typeof state !== "object") {
            throw new PersistenceError(
                "invalid_recovery_state",
                "invalid recovery state"
            );
        }

        await this.persistence.repository.save(
            RECOVERY_KEY,
            {
                version: 1,
                updatedAt: Date.now(),
                state: { ...state }
            }
        );

        return true;
    }

    async load() {
        if (!this.persistence.initialized) {
            throw new Error("persistence_not_initialized");
        }

        const record =
            await this.persistence.repository.load(
                RECOVERY_KEY
            );

        if (record === null) {
            return null;
        }

        if (
            !record ||
            record.version !== 1 ||
            !record.state ||
            typeof record.state !== "object" ||
            Array.isArray(record.state)
        ) {
            throw new PersistenceError(
                "invalid_recovery_state",
                "invalid persisted recovery state"
            );
        }

        return {
            ...record.state
        };
    }

    async clear() {
        if (!this.persistence.initialized) {
            throw new Error("persistence_not_initialized");
        }

        await this.persistence.repository.delete(
            RECOVERY_KEY
        );

        return true;
    }
}
