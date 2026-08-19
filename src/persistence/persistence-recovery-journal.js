import crypto from "node:crypto";

import { PersistenceError } from "./persistence-error.js";

const JOURNAL_KEY = "gateway-recovery-journal";

export class PersistenceRecoveryJournal {
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

    async append(operation, payload = {}) {
        if (!this.persistence.initialized) {
            throw new Error("persistence_not_initialized");
        }

        if (
            typeof operation !== "string" ||
            operation.length === 0
        ) {
            throw new PersistenceError(
                "invalid_recovery_operation",
                "invalid recovery operation"
            );
        }

        if (
            !payload ||
            typeof payload !== "object" ||
            Array.isArray(payload)
        ) {
            throw new PersistenceError(
                "invalid_recovery_payload",
                "invalid recovery payload"
            );
        }

        const journal =
            await this.persistence.repository.load(
                JOURNAL_KEY
            );

        const entries =
            journal === null
                ? []
                : this.#validateJournal(journal);

        const entry = {
            id: crypto.randomUUID(),
            operation,
            payload: { ...payload },
            createdAt: Date.now()
        };

        entries.push(entry);

        await this.persistence.repository.save(
            JOURNAL_KEY,
            {
                version: 1,
                entries
            }
        );

        return entry.id;
    }

    async load() {
        if (!this.persistence.initialized) {
            throw new Error("persistence_not_initialized");
        }

        const journal =
            await this.persistence.repository.load(
                JOURNAL_KEY
            );

        if (journal === null) {
            return [];
        }

        return this.#validateJournal(journal);
    }

    async clear() {
        if (!this.persistence.initialized) {
            throw new Error("persistence_not_initialized");
        }

        await this.persistence.repository.delete(
            JOURNAL_KEY
        );

        return true;
    }

    #validateJournal(record) {
        if (
            !record ||
            record.version !== 1 ||
            !Array.isArray(record.entries)
        ) {
            throw new PersistenceError(
                "invalid_recovery_journal",
                "invalid persisted recovery journal"
            );
        }

        return record.entries.map(entry => {
            if (
                !entry ||
                typeof entry.id !== "string" ||
                typeof entry.operation !== "string" ||
                !entry.payload ||
                typeof entry.payload !== "object" ||
                Array.isArray(entry.payload) ||
                typeof entry.createdAt !== "number"
            ) {
                throw new PersistenceError(
                    "invalid_recovery_journal",
                    "invalid persisted recovery journal entry"
                );
            }

            return {
                id: entry.id,
                operation: entry.operation,
                payload: { ...entry.payload },
                createdAt: entry.createdAt
            };
        });
    }
}
