import { PersistenceRecoveryJournal } from "./persistence-recovery-journal.js";

export class PersistenceRecoveryCoordinator {
    constructor(persistenceManager) {
        this.journal =
            new PersistenceRecoveryJournal(
                persistenceManager
            );

        this.handlers = new Map();
        this.initialized = false;
    }

    register(operation, handler) {
        if (
            typeof operation !== "string" ||
            operation.length === 0 ||
            typeof handler !== "function"
        ) {
            throw new Error("invalid_recovery_handler");
        }

        if (this.handlers.has(operation)) {
            throw new Error(
                `recovery_handler_already_registered:${operation}`
            );
        }

        this.handlers.set(
            operation,
            handler
        );

        return true;
    }

    async initialize() {
        await this.journal.initialize();
        this.initialized = true;
        return true;
    }

    async record(operation, payload = {}) {
        if (!this.initialized) {
            throw new Error(
                "recovery_not_initialized"
            );
        }

        return this.journal.append(
            operation,
            payload
        );
    }

    async recover(context) {
        if (!this.initialized) {
            throw new Error(
                "recovery_not_initialized"
            );
        }

        const entries =
            await this.journal.load();

        for (const entry of entries) {
            const handler =
                this.handlers.get(
                    entry.operation
                );

            if (!handler) {
                continue;
            }

            await handler(
                entry.payload,
                context
            );
        }

        return entries.length;
    }

    async clear() {
        if (!this.initialized) {
            throw new Error(
                "recovery_not_initialized"
            );
        }

        await this.journal.clear();
        return true;
    }

    async complete(operationId) {
        if (!this.initialized) {
            throw new Error(
                "recovery_not_initialized"
            );
        }

        if (
            typeof operationId !== "string" ||
            operationId.length === 0
        ) {
            throw new Error(
                "invalid_recovery_operation_id"
            );
        }

        const entries =
            await this.journal.load();

        const remaining =
            entries.filter(
                entry => entry.id !== operationId
            );

        if (
            remaining.length ===
            entries.length
        ) {
            return false;
        }

        if (remaining.length === 0) {
            await this.journal.clear();
            return true;
        }

        await this.journal.persistence.repository.save(
            "gateway-recovery-journal",
            {
                version: 1,
                entries: remaining
            }
        );

        return true;
    }
}
