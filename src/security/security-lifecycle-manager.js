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

    shutdown() {
        if (this.stopped) {
            return false;
        }

        this.security.replayProtection.clear();
        this.security.rateLimiter.clear();
        this.security.nodeLifecycleManager.revokeAll();

        this.sessionManager.clear();
        this.signalingService.clear();

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
