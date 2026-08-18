import { PersistenceError } from "../persistence/persistence-error.js";

const SECURITY_STATE_KEY = "security-state";
const REVOCATION_STATE_KEY = "security-revocations";

export class SecurityPersistenceManager {
    constructor(persistenceManager) {
        if (
            !persistenceManager ||
            typeof persistenceManager.initialize !== "function" ||
            typeof persistenceManager.saveRuntimeState !== "function"
        ) {
            throw new Error("invalid_persistence_manager");
        }

        this.persistence = persistenceManager;
    }

    async initialize() {
        await this.persistence.initialize();
        return true;
    }

    async save(securityManager) {
        if (!securityManager) {
            throw new Error("invalid_security_manager");
        }

        const stateManager =
            securityManager.stateManager;

        const revocationManager =
            securityManager.revocationManager;

        if (
            !stateManager ||
            !revocationManager
        ) {
            throw new Error(
                "invalid_security_manager_state"
            );
        }

        const states = {};

        for (
            const [nodeId, record]
            of stateManager.states
        ) {
            states[nodeId] = {
                nodeId: record.nodeId,
                state: record.state,
                updatedAt: record.updatedAt
            };
        }

        const revocations = {};

        for (
            const [nodeId, record]
            of revocationManager.revokedNodes
        ) {
            revocations[nodeId] = {
                nodeId: record.nodeId,
                reason: record.reason,
                revokedAt: record.revokedAt
            };
        }

        await this.persistence.repository.save(
            SECURITY_STATE_KEY,
            {
                version: 1,
                updatedAt: Date.now(),
                states
            }
        );

        await this.persistence.repository.save(
            REVOCATION_STATE_KEY,
            {
                version: 1,
                updatedAt: Date.now(),
                revocations
            }
        );

        return true;
    }

    async restore(securityManager) {
        if (!securityManager) {
            throw new Error("invalid_security_manager");
        }

        const stateRecord =
            await this.persistence.repository.load(
                SECURITY_STATE_KEY
            );

        const revocationRecord =
            await this.persistence.repository.load(
                REVOCATION_STATE_KEY
            );

        if (stateRecord !== null) {
            this.#restoreStates(
                securityManager,
                stateRecord
            );
        }

        if (revocationRecord !== null) {
            this.#restoreRevocations(
                securityManager,
                revocationRecord
            );
        }

        return true;
    }

    #restoreStates(securityManager, record) {
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

        const stateManager =
            securityManager.stateManager;

        stateManager.clear();

        for (
            const [nodeId, state]
            of Object.entries(record.states)
        ) {
            if (
                typeof nodeId !== "string" ||
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

            stateManager.states.set(
                nodeId,
                {
                    nodeId,
                    state: state.state,
                    updatedAt: state.updatedAt
                }
            );
        }
    }

    #restoreRevocations(securityManager, record) {
        if (
            !record ||
            record.version !== 1 ||
            !record.revocations ||
            typeof record.revocations !== "object" ||
            Array.isArray(record.revocations)
        ) {
            throw new PersistenceError(
                "invalid_security_revocations",
                "invalid persisted security revocation state"
            );
        }

        const revocationManager =
            securityManager.revocationManager;

        revocationManager.clear();

        for (
            const [nodeId, revocation]
            of Object.entries(record.revocations)
        ) {
            if (
                typeof nodeId !== "string" ||
                !revocation ||
                typeof revocation !== "object"
            ) {
                throw new PersistenceError(
                    "invalid_security_revocations",
                    "invalid persisted security revocation record"
                );
            }

            revocationManager.revokedNodes.set(
                nodeId,
                {
                    nodeId,
                    reason:
                        typeof revocation.reason === "string"
                            ? revocation.reason
                            : "restored",
                    revokedAt:
                        typeof revocation.revokedAt === "number"
                            ? revocation.revokedAt
                            : Date.now()
                }
            );
        }
    }

    async shutdown(securityManager) {
        if (securityManager) {
            await this.save(securityManager);
        }

        return true;
    }
}
