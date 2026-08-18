import { PersistenceError } from "../persistence/persistence-error.js";

const SESSION_STATE_KEY = "session-state";

export class SessionPersistenceManager {
    constructor(persistenceManager) {
        if (
            !persistenceManager ||
            typeof persistenceManager.initialize !== "function"
        ) {
            throw new Error("invalid_persistence_manager");
        }

        this.persistence = persistenceManager;
    }

    async initialize() {
        await this.persistence.initialize();
        return true;
    }

    async save(sessionManager) {
        if (!sessionManager) {
            throw new Error("invalid_session_manager");
        }

        if (!(sessionManager.sessions instanceof Map)) {
            throw new Error("invalid_session_manager_state");
        }

        const sessions = Object.fromEntries(
            sessionManager.sessions
        );

        await this.persistence.repository.save(
            SESSION_STATE_KEY,
            {
                version: 1,
                updatedAt: Date.now(),
                sessions
            }
        );

        return true;
    }

    async restore(sessionManager) {
        if (!sessionManager) {
            throw new Error("invalid_session_manager");
        }

        const record =
            await this.persistence.repository.load(
                SESSION_STATE_KEY
            );

        if (record === null) {
            return true;
        }

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

        if (!(sessionManager.sessions instanceof Map)) {
            throw new Error("invalid_session_manager_state");
        }

        sessionManager.sessions.clear();

        for (
            const [sessionId, session]
            of Object.entries(record.sessions)
        ) {
            if (
                typeof sessionId !== "string" ||
                !session ||
                typeof session !== "object"
            ) {
                throw new PersistenceError(
                    "invalid_session_state",
                    "invalid persisted session record"
                );
            }

            sessionManager.sessions.set(
                sessionId,
                { ...session }
            );
        }

        return true;
    }

    async shutdown(sessionManager) {
        if (sessionManager) {
            await this.save(sessionManager);
        }

        return true;
    }
}
