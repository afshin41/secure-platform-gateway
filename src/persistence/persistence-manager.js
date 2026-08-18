import { PersistenceError } from "./persistence-error.js";
import { FilePersistenceRepository } from "./file-persistence-repository.js";

const RUNTIME_KEY = "gateway-runtime";

export class PersistenceManager {
    constructor(config, repository = null) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        this.config = config;
        this.repository =
            repository ||
            new FilePersistenceRepository(config);

        this.initialized = false;
        this.failed = false;
        this.lastError = null;
    }

    async initialize() {
        if (this.initialized) {
            return true;
        }

        try {
            await this.repository.initialize();
            this.initialized = true;
            this.failed = false;
            this.lastError = null;
            return true;
        } catch (error) {
            this.failed = true;
            this.lastError = error;
            throw error;
        }
    }

    async saveRuntimeState(state) {
        if (!this.initialized) {
            await this.initialize();
        }

        if (!state || typeof state !== "object") {
            throw new PersistenceError(
                "invalid_runtime_state",
                "invalid runtime state"
            );
        }

        try {
            await this.repository.save(
                RUNTIME_KEY,
                {
                    version: 1,
                    updatedAt: Date.now(),
                    state: { ...state }
                }
            );

            this.failed = false;
            this.lastError = null;

            return true;
        } catch (error) {
            this.failed = true;
            this.lastError = error;
            throw error;
        }
    }

    async loadRuntimeState() {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const record =
                await this.repository.load(RUNTIME_KEY);

            if (record === null) {
                return null;
            }

            if (
                !record ||
                record.version !== 1 ||
                !record.state ||
                typeof record.state !== "object"
            ) {
                throw new PersistenceError(
                    "invalid_runtime_state",
                    "invalid persisted runtime state"
                );
            }

            this.failed = false;
            this.lastError = null;

            return { ...record.state };
        } catch (error) {
            this.failed = true;
            this.lastError = error;
            throw error;
        }
    }

    async shutdown() {
        if (!this.initialized) {
            return false;
        }

        this.initialized = false;
        return true;
    }

    getStatus() {
        return {
            initialized: this.initialized,
            healthy: !this.failed,
            lastError:
                this.lastError
                    ? {
                        name: this.lastError.name,
                        code:
                            this.lastError.code ||
                            "unknown_error"
                    }
                    : null
        };
    }
}
