import { PersistenceError } from "./persistence-error.js";

const AUDIT_STATE_KEY = "audit-state";

export class PersistenceAuditManager {
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
    }

    async initialize() {
        await this.persistence.initialize();
        return true;
    }

    async save(auditManager) {
        if (!auditManager) {
            throw new Error("invalid_audit_manager");
        }

        const events =
            auditManager.events ??
            auditManager.auditEvents;

        if (!(events instanceof Map) && !Array.isArray(events)) {
            throw new Error("invalid_audit_manager_state");
        }

        const serialized =
            events instanceof Map
                ? Object.fromEntries(events)
                : [...events];

        await this.persistence.repository.save(
            AUDIT_STATE_KEY,
            {
                version: 1,
                updatedAt: Date.now(),
                events: serialized
            }
        );

        return true;
    }

    async restore(auditManager) {
        if (!auditManager) {
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
            record.events === undefined
        ) {
            throw new PersistenceError(
                "invalid_audit_state",
                "invalid persisted audit state"
            );
        }

        const events =
            auditManager.events ??
            auditManager.auditEvents;

        if (events instanceof Map) {
            events.clear();

            if (
                !record.events ||
                typeof record.events !== "object" ||
                Array.isArray(record.events)
            ) {
                throw new PersistenceError(
                    "invalid_audit_state",
                    "invalid persisted audit event collection"
                );
            }

            for (
                const [eventId, event]
                of Object.entries(record.events)
            ) {
                if (
                    !eventId ||
                    !event ||
                    typeof event !== "object"
                ) {
                    throw new PersistenceError(
                        "invalid_audit_state",
                        "invalid persisted audit event"
                    );
                }

                events.set(
                    eventId,
                    { ...event }
                );
            }

            return true;
        }

        if (Array.isArray(events)) {
            events.length = 0;

            if (!Array.isArray(record.events)) {
                throw new PersistenceError(
                    "invalid_audit_state",
                    "invalid persisted audit event collection"
                );
            }

            for (const event of record.events) {
                if (
                    !event ||
                    typeof event !== "object"
                ) {
                    throw new PersistenceError(
                        "invalid_audit_state",
                        "invalid persisted audit event"
                    );
                }

                events.push({ ...event });
            }

            return true;
        }

        throw new Error("invalid_audit_manager_state");
    }

    async shutdown(auditManager) {
        if (auditManager) {
            await this.save(auditManager);
        }

        return true;
    }
}
