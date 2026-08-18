import { PersistenceError } from "./persistence-error.js";

export class PersistenceRecoveryManager {
    constructor(persistenceManager) {
        if (
            !persistenceManager ||
            typeof persistenceManager.initialize !== "function" ||
            typeof persistenceManager.repository?.load !== "function"
        ) {
            throw new Error("invalid_persistence_manager");
        }

        this.persistence = persistenceManager;
        this.recovered = false;
        this.lastError = null;
    }

    async initialize() {
        try {
            await this.persistence.initialize();

            this.recovered = false;
            this.lastError = null;

            return true;
        } catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    async recover(key, restore) {
        if (typeof key !== "string" || key.length === 0) {
            throw new PersistenceError(
                "invalid_recovery_key",
                "invalid recovery key"
            );
        }

        if (typeof restore !== "function") {
            throw new Error("invalid_restore_handler");
        }

        try {
            const record =
                await this.persistence.repository.load(key);

            if (record === null) {
                this.recovered = true;
                this.lastError = null;
                return false;
            }

            await restore(record);

            this.recovered = true;
            this.lastError = null;

            return true;
        } catch (error) {
            this.recovered = false;
            this.lastError = error;
            throw error;
        }
    }

    getStatus() {
        return {
            recovered: this.recovered,
            healthy: this.lastError === null,
            lastError: this.lastError
                ? {
                    name: this.lastError.name,
                    code:
                        this.lastError.code ||
                        "unknown_error"
                }
                : null
        };
    }
}
