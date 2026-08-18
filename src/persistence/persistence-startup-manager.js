export class PersistenceStartupManager {
    constructor(
        persistenceManager,
        securityPersistenceManager,
        sessionPersistenceManager
    ) {
        if (
            !persistenceManager ||
            !securityPersistenceManager ||
            !sessionPersistenceManager
        ) {
            throw new Error(
                "invalid_persistence_components"
            );
        }

        this.persistence = persistenceManager;
        this.securityPersistence =
            securityPersistenceManager;
        this.sessionPersistence =
            sessionPersistenceManager;

        this.started = false;
    }

    async start(
        securityManager,
        sessionManager
    ) {
        if (!securityManager) {
            throw new Error("invalid_security_manager");
        }

        if (!sessionManager) {
            throw new Error("invalid_session_manager");
        }

        await this.persistence.initialize();

        await this.securityPersistence.initialize();

        await this.sessionPersistence.initialize();

        await this.securityPersistence.restore(
            securityManager
        );

        await this.sessionPersistence.restore(
            sessionManager
        );

        this.started = true;

        return true;
    }

    async stop(
        securityManager,
        sessionManager
    ) {
        if (!this.started) {
            return false;
        }

        await this.securityPersistence.shutdown(
            securityManager
        );

        await this.sessionPersistence.shutdown(
            sessionManager
        );

        this.started = false;

        return true;
    }

    isStarted() {
        return this.started;
    }
}
