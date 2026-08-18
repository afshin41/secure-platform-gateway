export class SecurityPersistenceCoordinator {
    constructor(
        securityPersistenceManager,
        sessionPersistenceManager
    ) {
        if (
            !securityPersistenceManager ||
            typeof securityPersistenceManager.save !== "function" ||
            typeof securityPersistenceManager.restore !== "function"
        ) {
            throw new Error(
                "invalid_security_persistence_manager"
            );
        }

        if (
            !sessionPersistenceManager ||
            typeof sessionPersistenceManager.save !== "function" ||
            typeof sessionPersistenceManager.restore !== "function"
        ) {
            throw new Error(
                "invalid_session_persistence_manager"
            );
        }

        this.securityPersistence =
            securityPersistenceManager;

        this.sessionPersistence =
            sessionPersistenceManager;

        this.initialized = false;
    }

    async initialize(
        securityManager,
        sessionManager
    ) {
        if (!securityManager) {
            throw new Error("invalid_security_manager");
        }

        if (!sessionManager) {
            throw new Error("invalid_session_manager");
        }

        await this.securityPersistence.initialize();
        await this.sessionPersistence.initialize();

        await this.securityPersistence.restore(
            securityManager
        );

        await this.sessionPersistence.restore(
            sessionManager
        );

        this.initialized = true;

        return true;
    }

    async save(
        securityManager,
        sessionManager
    ) {
        if (!this.initialized) {
            throw new Error(
                "persistence_coordinator_not_initialized"
            );
        }

        await this.securityPersistence.save(
            securityManager
        );

        await this.sessionPersistence.save(
            sessionManager
        );

        return true;
    }

    async shutdown(
        securityManager,
        sessionManager
    ) {
        if (!this.initialized) {
            return false;
        }

        await this.save(
            securityManager,
            sessionManager
        );

        this.initialized = false;

        return true;
    }

    isInitialized() {
        return this.initialized;
    }
}
