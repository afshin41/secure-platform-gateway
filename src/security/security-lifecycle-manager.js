import { SessionPersistenceManager } from "./session-persistence-manager.js";

export class SecurityLifecycleManager {
    constructor(
        config,
        securityIntegration,
        sessionManager,
        signalingService
    ) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        if (!securityIntegration) {
            throw new Error("invalid_security_integration");
        }

        if (!sessionManager) {
            throw new Error("invalid_session_manager");
        }

        if (!signalingService) {
            throw new Error("invalid_signaling_service");
        }

        this.config = config;
        this.security = securityIntegration;
        this.sessionManager = sessionManager;
        this.signalingService = signalingService;
        this.persistenceManager = null;
        this.sessionPersistenceManager = null;
        this.started = false;
        this.stopped = false;
    }

    start() {
        if (this.stopped) {
            throw new Error("security_lifecycle_stopped");
        }

        this.started = true;

        return true;
    }

    async initializePersistence(persistenceManager) {
        if (!persistenceManager) {
            throw new Error("invalid_persistence_manager");
        }

        this.persistenceManager = persistenceManager;

        await this.persistenceManager.initialize();

        if (
            typeof this.security.initializePersistence ===
            "function"
        ) {
            await this.security.initializePersistence(
                this.persistenceManager
            );
        }

        this.sessionPersistenceManager =
            new SessionPersistenceManager(
                this.persistenceManager
            );

        await this.sessionPersistenceManager.initialize();

        await this.sessionPersistenceManager.restore(
            this.sessionManager
        );

        return true;
    }

    async shutdownPersistence() {
        if (!this.persistenceManager) {
            return false;
        }

        await this.persistenceManager.shutdown();
        return true;
    }

    shutdown() {
        if (this.stopped) {
            return false;
        }

        this.security.replayProtection.clear();
        this.security.rateLimiter.clear();
        this.security.nodeLifecycleManager.revokeAll();

        if (
            this.sessionManager &&
            typeof this.sessionManager.clear === "function"
        ) {
            this.sessionManager.clear();
        }

        if (
            this.signalingService &&
            typeof this.signalingService.clear === "function"
        ) {
            this.signalingService.clear();
        }

        this.started = false;
        this.stopped = true;

        return true;
    }

    isStarted() {
        return this.started;
    }

    isStopped() {
        return this.stopped;
    }
}
