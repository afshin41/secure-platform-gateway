import { PersistenceError } from "./persistence-error.js";

export class PersistenceRecoveryCoordinator {
    constructor(
        persistenceManager,
        recoveryManager
    ) {
        if (
            !persistenceManager ||
            !recoveryManager
        ) {
            throw new Error(
                "invalid_persistence_recovery_components"
            );
        }

        this.persistence = persistenceManager;
        this.recovery = recoveryManager;
        this.initialized = false;
    }

    async initialize() {
        await this.persistence.initialize();
        await this.recovery.initialize();

        this.initialized = true;

        return true;
    }

    async recoverSecurity(
        securityManager,
        securityKey = "security-state"
    ) {
        if (!this.initialized) {
            throw new Error(
                "persistence_recovery_not_initialized"
            );
        }

        if (!securityManager) {
            throw new Error("invalid_security_manager");
        }

        return this.recovery.recover(
            securityKey,
            async record => {
                if (
                    !record ||
                    record.version !== 1 ||
                    !record.states ||
                    typeof record.states !== "object" ||
                    Array.isArray(record.states)
                ) {
                    throw new PersistenceError(
                        "invalid_security_state",
                        "invalid persisted security state"
                    );
                }

                const states =
                    securityManager.stateManager?.states;

                if (!(states instanceof Map)) {
                    throw new Error(
                        "invalid_security_manager_state"
                    );
                }

                states.clear();

                for (
                    const [nodeId, state]
                    of Object.entries(record.states)
                ) {
                    if (
                        !nodeId ||
                        !state ||
                        typeof state !== "object" ||
                        typeof state.state !== "string" ||
                        typeof state.updatedAt !== "number"
                    ) {
                        throw new PersistenceError(
                            "invalid_security_state",
                            "invalid persisted security state record"
                        );
                    }

                    states.set(nodeId, {
                        nodeId,
                        state: state.state,
                        updatedAt: state.updatedAt
                    });
                }
            }
        );
    }

    async recoverSessions(
        sessionManager,
        sessionKey = "session-state"
    ) {
        if (!this.initialized) {
            throw new Error(
                "persistence_recovery_not_initialized"
            );
        }

        if (!sessionManager) {
            throw new Error("invalid_session_manager");
        }

        return this.recovery.recover(
            sessionKey,
            async record => {
                if (
                    !record ||
                    record.version !== 1 ||
                    !record.sessions ||
                    typeof record.sessions !== "object" ||
                    Array.isArray(record.sessions)
                ) {
                    throw new PersistenceError(
                        "invalid_session_state",
                        "invalid persisted session state"
                    );
                }

                const sessions =
                    sessionManager.sessions;

                if (!(sessions instanceof Map)) {
                    throw new Error(
                        "invalid_session_manager_state"
                    );
                }

                sessions.clear();

                for (
                    const [sessionId, session]
                    of Object.entries(record.sessions)
                ) {
                    if (
                        !sessionId ||
                        !session ||
                        typeof session !== "object"
                    ) {
                        throw new PersistenceError(
                            "invalid_session_state",
                            "invalid persisted session record"
                        );
                    }

                    sessions.set(
                        sessionId,
                        { ...session }
                    );
                }
            }
        );
    }

    getStatus() {
        return {
            initialized: this.initialized,
            recovery: this.recovery.getStatus()
        };
    }
}
