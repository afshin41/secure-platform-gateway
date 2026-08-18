import { PersistenceError } from "../persistence/persistence-error.js";

const AUDIT_STATE_KEY = "security-audit";

export class SecurityAuditPersistenceManager {
    constructor(persistenceManager) {
        if (
            !persistenceManager ||
            typeof persistenceManager.initialize !== "function"
        ) {
            throw new Error("invalid_persistence_manager");
        }

        this.persistence = persistenceManager;
    }

    async initialize() {
        await this.persistence.initialize();
        return true;
    }

    async save(securityManager) {
        if (!securityManager) {
            throw new Error("invalid_security_manager");
        }

        const auditManager = securityManager.auditManager;

        if (!auditManager) {
            throw new Error("invalid_audit_manager");
        }

        const events =
            auditManager.events instanceof Map
                ? Object.fromEntries(auditManager.events)
                : Array.isArray(auditManager.events)
                    ? [...auditManager.events]
                    : [];

        await this.persistence.repository.save(
            AUDIT_STATE_KEY,
            {
                version: 1,
                updatedAt: Date.now(),
                events
            }
        );

        return true;
    }

    async restore(securityManager) {
        if (!securityManager) {
            throw new Error("invalid_security_manager");
        }

        const record =
            await this.persistence.repository.load(
                AUDIT_STATE_KEY
            );

        if (record === null) {
            return true;
        }

        if (
            !record ||
            record.version !== 1 ||
            !Array.isArray(record.events) &&
            (
                !record.events ||
                typeof record.events !== "object"
            )
        ) {
            throw new PersistenceError(
                "invalid_security_audit",
                "invalid persisted security audit state"
            );
        }

        const auditManager = securityManager.auditManager;

        if (!auditManager) {
            throw new Error("invalid_audit_manager");
        }

        if (auditManager.events instanceof Map) {
            auditManager.events.clear();

            for (const [key, value] of Object.entries(
                record.events
            )) {
                auditManager.events.set(key, value);
            }
        }

        return true;
    }

    async shutdown(securityManager) {
        if (securityManager) {
            await this.save(securityManager);
        }

        return true;
    }
}
