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
        if (this.initialized) {
            return true;
        }

        await this.runtime.initialize();
        await this.audit.initialize();
        await this.session.initialize();

        try {
            await this.runtime.restore(
                securityManager
            );

            await this.audit.restore(
                auditManager
            );

            await this.session.restore(
                sessionManager
            );
        } catch (error) {
            this.initialized = false;
            throw error;
        }

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

        const runtimeSaved =
            await this.runtime.save(
                securityManager
            );

        if (runtimeSaved !== true) {
            throw new Error(
                "security_runtime_persistence_failed"
            );
        }

        const auditSaved =
            await this.audit.save(
                auditManager
            );

        if (auditSaved !== true) {
            throw new Error(
                "security_audit_persistence_failed"
            );
        }

        const sessionSaved =
            await this.session.save(
                sessionManager
            );

        if (sessionSaved !== true) {
            throw new Error(
                "security_session_persistence_failed"
            );
        }

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
