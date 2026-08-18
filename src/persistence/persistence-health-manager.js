export class PersistenceHealthManager {
    constructor(persistenceManager) {
        if (!persistenceManager) {
            throw new Error("invalid_persistence_manager");
        }

        this.persistence = persistenceManager;
    }

    getStatus() {
        const status =
            typeof this.persistence.getStatus === "function"
                ? this.persistence.getStatus()
                : null;

        const initialized =
            status?.initialized === true;

        const healthy =
            initialized &&
            status?.healthy !== false;

        return {
            status: healthy ? "ok" : "degraded",
            initialized,
            healthy,
            lastError: status?.lastError ?? null,
            timestamp: Date.now()
        };
    }
}
