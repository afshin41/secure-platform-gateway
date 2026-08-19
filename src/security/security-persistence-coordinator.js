export class SecurityPersistenceCoordinator {
    constructor({
        runtimePersistence,
        auditPersistence,
        sessionPersistence
    }) {
        if (
            !runtimePersistence ||
            !auditPersistence ||
            !sessionPersistence
        ) {
            throw new Error(
                "invalid_security_persistence"
            );
        }

        this.runtime = runtimePersistence;
        this.audit = auditPersistence;
        this.session = sessionPersistence;
        this.initialized = false;
    }

    async initialize(
        securityManager,
        auditManager,
        sessionManager
    ) {
        await this.runtime.initialize();
        await this.audit.initialize();
        await this.session.initialize();

        await this.runtime.restore(
            securityManager
        );

        await this.audit.restore(
            auditManager
        );

        await this.session.restore(
            sessionManager
        );

        this.initialized = true;

        return true;
    }

    async save(
        securityManager,
        auditManager,
        sessionManager
    ) {
        if (!this.initialized) {
            throw new Error(
                "security_persistence_not_initialized"
            );
        }

        await this.runtime.save(
            securityManager
        );

        await this.audit.save(
            auditManager
        );

        await this.session.save(
            sessionManager
        );

        return true;
    }

    async restore(
        securityManager,
        auditManager,
        sessionManager
    ) {
        if (!this.initialized) {
            throw new Error(
                "security_persistence_not_initialized"
            );
        }

        await this.runtime.restore(
            securityManager
        );

        await this.audit.restore(
            auditManager
        );

        await this.session.restore(
            sessionManager
        );

        return true;
    }

    async shutdown(
        securityManager,
        auditManager,
        sessionManager
    ) {
        if (!this.initialized) {
            return false;
        }

        await this.save(
            securityManager,
            auditManager,
            sessionManager
        );

        this.initialized = false;

        return true;
    }
}
