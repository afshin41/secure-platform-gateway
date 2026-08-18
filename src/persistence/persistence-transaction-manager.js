import { PersistenceError } from "./persistence-error.js";

export class PersistenceTransactionManager {
    constructor(persistenceManager) {
        if (
            !persistenceManager ||
            typeof persistenceManager.initialize !== "function" ||
            typeof persistenceManager.repository?.save !== "function" ||
            typeof persistenceManager.repository?.load !== "function"
        ) {
            throw new Error("invalid_persistence_manager");
        }

        this.persistence = persistenceManager;
        this.active = false;
    }

    async initialize() {
        await this.persistence.initialize();
        return true;
    }

    async begin() {
        if (this.active) {
            throw new PersistenceError(
                "transaction_active",
                "persistence transaction already active"
            );
        }

        this.active = true;
        return true;
    }

    async commit(entries) {
        if (!this.active) {
            throw new PersistenceError(
                "transaction_not_active",
                "persistence transaction is not active"
            );
        }

        if (
            !entries ||
            typeof entries !== "object" ||
            Array.isArray(entries)
        ) {
            throw new PersistenceError(
                "invalid_transaction_entries",
                "invalid persistence transaction entries"
            );
        }

        try {
            for (const [key, value] of Object.entries(entries)) {
                await this.persistence.repository.save(
                    key,
                    value
                );
            }

            this.active = false;
            return true;
        } catch (error) {
            this.active = false;
            throw new PersistenceError(
                "transaction_failed",
                "persistence transaction failed",
                error
            );
        }
    }

    rollback() {
        if (!this.active) {
            return false;
        }

        this.active = false;
        return true;
    }

    isActive() {
        return this.active;
    }
}
