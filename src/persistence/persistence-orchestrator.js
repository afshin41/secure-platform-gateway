export class PersistenceOrchestrator {
    constructor(
        persistenceManager,
        securityPersistenceManager,
        sessionPersistenceManager,
        auditPersistenceManager
    ) {
        if (
            !persistenceManager ||
            !securityPersistenceManager ||
            !sessionPersistenceManager ||
            !auditPersistenceManager
        ) {
            throw new Error(
                "invalid_persistence_components"
            );
        }

        this.persistence = persistenceManager;
        this.security = securityPersistenceManager;
        this.sessions = sessionPersistenceManager;
        this.audit = auditPersistenceManager;

        this.initialized = false;
    }

    async initialize(
        securityManager,
        sessionManager,
        auditManager
    ) {
        if (!securityManager) {
            throw new Error("invalid_security_manager");
        }

        if (!sessionManager) {
            throw new Error("invalid_session_manager");
        }

        if (!auditManager) {
            throw new Error("invalid_audit_manager");
        }

        await this.persistence.initialize();
        await this.security.initialize();
        await this.sessions.initialize();
        await this.audit.initialize();

        await this.security.restore(
            securityManager
        );

        await this.sessions.restore(
            sessionManager
        );

        await this.audit.restore(
            auditManager
        );

        this.initialized = true;

        return true;
    }

    async save(
        securityManager,
        sessionManager,
        auditManager
    ) {
        if (!this.initialized) {
            throw new Error(
                "persistence_not_initialized"
            );
        }

        await this.security.save(
            securityManager
        );

        await this.sessions.save(
            sessionManager
        );

        await this.audit.save(
            auditManager
        );

        return true;
    }

    async shutdown(
        securityManager,
        sessionManager,
        auditManager
    ) {
        if (!this.initialized) {
            return false;
        }

        await this.save(
            securityManager,
            sessionManager,
            auditManager
        );

        this.initialized = false;

        return true;
    }

    isInitialized() {
        return this.initialized;
    }
}
