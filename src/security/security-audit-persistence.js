import { PersistenceError } from "../persistence/persistence-error.js";

const AUDIT_STATE_KEY = "security-audit-state";

export class SecurityAuditPersistence {
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

    async save(auditManager) {
        if (!this.persistence.initialized) {
            throw new Error("persistence_not_initialized");
        }

        if (!auditManager || typeof auditManager !== "object") {
            throw new Error("invalid_audit_manager");
        }

        const events =
            Array.isArray(auditManager.events)
                ? auditManager.events
                : Array.isArray(auditManager.auditEvents)
                    ? auditManager.auditEvents
                    : null;

        if (!Array.isArray(events)) {
            throw new PersistenceError(
                "invalid_audit_state",
                "invalid audit event storage"
            );
        }

        await this.persistence.repository.save(
            AUDIT_STATE_KEY,
            {
                version: 1,
                updatedAt: Date.now(),
                events: events.map(event => ({
                    ...event
                }))
            }
        );

        return true;
    }

    async restore(auditManager) {
        if (!this.persistence.initialized) {
            throw new Error("persistence_not_initialized");
        }

        if (!auditManager || typeof auditManager !== "object") {
            throw new Error("invalid_audit_manager");
        }

        const record =
            await this.persistence.repository.load(
                AUDIT_STATE_KEY
            );

        if (record === null) {
            return false;
        }

        if (
            !record ||
            record.version !== 1 ||
            !Array.isArray(record.events)
        ) {
            throw new PersistenceError(
                "invalid_audit_state",
                "invalid persisted audit state"
            );
        }

        const events =
            Array.isArray(auditManager.events)
                ? auditManager.events
                : Array.isArray(auditManager.auditEvents)
                    ? auditManager.auditEvents
                    : null;

        if (!Array.isArray(events)) {
            throw new PersistenceError(
                "invalid_audit_state",
                "invalid audit event storage"
            );
        }

        events.length = 0;

        for (const event of record.events) {
            if (
                !event ||
                typeof event !== "object" ||
                Array.isArray(event)
            ) {
                throw new PersistenceError(
                    "invalid_audit_state",
                    "invalid persisted audit event"
                );
            }

            events.push({
                ...event
            });
        }

        return true;
    }

    async shutdown(auditManager) {
        if (auditManager) {
            await this.save(auditManager);
        }

        return true;
    }
}
