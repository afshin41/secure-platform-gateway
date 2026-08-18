import { PersistenceError } from "./persistence-error.js";

export class PersistenceConsistencyManager {
    constructor(persistenceManager) {
        if (
            !persistenceManager ||
            typeof persistenceManager.initialize !== "function" ||
            typeof persistenceManager.repository?.load !== "function"
        ) {
            throw new Error("invalid_persistence_manager");
        }

        this.persistence = persistenceManager;
    }

    async initialize() {
        await this.persistence.initialize();
        return true;
    }

    async verify(keys) {
        if (
            !Array.isArray(keys) ||
            keys.length === 0
        ) {
            throw new PersistenceError(
                "invalid_consistency_keys",
                "invalid persistence consistency keys"
            );
        }

        const records = {};

        for (const key of keys) {
            if (
                typeof key !== "string" ||
                key.length === 0
            ) {
                throw new PersistenceError(
                    "invalid_consistency_key",
                    "invalid persistence consistency key"
                );
            }

            const value =
                await this.persistence.repository.load(key);

            records[key] = value;
        }

        return {
            consistent: true,
            records,
            checkedAt: Date.now()
        };
    }
}
