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

        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) {
            return true;
        }

        await this.securityPersistence.initialize();
        await this.auditPersistence.initialize();

        this.initialized = true;

        return true;
    }

    async restore(securityManager) {
        if (!this.initialized) {
            await this.initialize();
        }

        await this.securityPersistence.restore(
            securityManager
        );

        await this.auditPersistence.restore(
            securityManager
        );

        return true;
    }

    async save(securityManager) {
        if (!this.initialized) {
            await this.initialize();
        }

        await this.securityPersistence.save(
            securityManager
        );

        await this.auditPersistence.save(
            securityManager
        );

        return true;
    }

    async shutdown(securityManager) {
        if (!this.initialized) {
            return false;
        }

        await this.save(securityManager);

        this.initialized = false;

        return true;
    }
}
