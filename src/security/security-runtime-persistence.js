import { SecurityPersistenceManager } from "./security-persistence-manager.js";
import { SecurityAuditPersistenceManager } from "./security-audit-persistence-manager.js";

export class SecurityRuntimePersistence {
    constructor(persistenceManager) {
        if (!persistenceManager) {
            throw new Error("invalid_persistence_manager");
        }

        this.securityPersistence =
            new SecurityPersistenceManager(
                persistenceManager
            );

        this.auditPersistence =
            new SecurityAuditPersistenceManager(
                persistenceManager
            );
    }

    async initialize() {
        await this.securityPersistence.initialize();
        await this.auditPersistence.initialize();

        return true;
    }

    async restore(securityManager) {
        await this.securityPersistence.restore(
            securityManager
        );

        await this.auditPersistence.restore(
            securityManager
        );

        return true;
    }

    async save(securityManager) {
        await this.securityPersistence.save(
            securityManager
        );

        await this.auditPersistence.save(
            securityManager
        );

        return true;
    }

    async shutdown(securityManager) {
        await this.save(securityManager);

        return true;
    }
}
