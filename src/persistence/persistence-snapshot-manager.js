import { PersistenceError } from "./persistence-error.js";

const SNAPSHOT_KEY = "gateway-snapshot";

export class PersistenceSnapshotManager {
    constructor(persistenceManager) {
        if (
            !persistenceManager ||
            typeof persistenceManager.initialize !== "function" ||
            typeof persistenceManager.repository?.save !== "function" ||
            typeof persistenceManager.repository?.load !== "function"
        ) {
            throw new Error("invalid_persistence_manager");
        }

        this.persistence = persistenceManager;
    }

    async initialize() {
        await this.persistence.initialize();
        return true;
    }

    async save(
        securityManager,
        sessionManager
    ) {
        if (!securityManager) {
            throw new Error("invalid_security_manager");
        }

        if (!sessionManager) {
            throw new Error("invalid_session_manager");
        }

        const states =
            securityManager.stateManager?.states;

        const revocations =
            securityManager.revocationManager?.revokedNodes;

        const sessions =
            sessionManager.sessions;

        if (
            !(states instanceof Map) ||
            !(revocations instanceof Map) ||
            !(sessions instanceof Map)
        ) {
            throw new Error(
                "invalid_runtime_state"
            );
        }

        await this.persistence.repository.save(
            SNAPSHOT_KEY,
            {
                version: 1,
                updatedAt: Date.now(),
                security: {
                    states:
                        Object.fromEntries(states),
                    revocations:
                        Object.fromEntries(revocations)
                },
                sessions:
                    Object.fromEntries(sessions)
            }
        );

        return true;
    }

    async load() {
        const snapshot =
            await this.persistence.repository.load(
                SNAPSHOT_KEY
            );

        if (snapshot === null) {
            return null;
        }

        if (
            !snapshot ||
            snapshot.version !== 1 ||
            !snapshot.security ||
            typeof snapshot.security !== "object" ||
            !snapshot.security.states ||
            typeof snapshot.security.states !== "object" ||
            Array.isArray(snapshot.security.states) ||
            !snapshot.security.revocations ||
            typeof snapshot.security.revocations !== "object" ||
            Array.isArray(snapshot.security.revocations) ||
            !snapshot.sessions ||
            typeof snapshot.sessions !== "object" ||
            Array.isArray(snapshot.sessions)
        ) {
            throw new PersistenceError(
                "invalid_snapshot",
                "invalid persisted gateway snapshot"
            );
        }

        return snapshot;
    }

    async restore(
        securityManager,
        sessionManager
    ) {
        const snapshot = await this.load();

        if (snapshot === null) {
            return false;
        }

        if (!securityManager) {
            throw new Error("invalid_security_manager");
        }

        if (!sessionManager) {
            throw new Error("invalid_session_manager");
        }

        const states =
            securityManager.stateManager?.states;

        const revocations =
            securityManager.revocationManager?.revokedNodes;

        const sessions =
            sessionManager.sessions;

        if (
            !(states instanceof Map) ||
            !(revocations instanceof Map) ||
            !(sessions instanceof Map)
        ) {
            throw new Error(
                "invalid_runtime_state"
            );
        }

        states.clear();
        revocations.clear();
        sessions.clear();

        for (
            const [nodeId, state]
            of Object.entries(snapshot.security.states)
        ) {
            states.set(
                nodeId,
                { ...state }
            );
        }

        for (
            const [nodeId, revocation]
            of Object.entries(snapshot.security.revocations)
        ) {
            revocations.set(
                nodeId,
                { ...revocation }
            );
        }

        for (
            const [sessionId, session]
            of Object.entries(snapshot.sessions)
        ) {
            sessions.set(
                sessionId,
                { ...session }
            );
        }

        return true;
    }
}
