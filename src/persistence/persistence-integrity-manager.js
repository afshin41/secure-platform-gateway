import crypto from "node:crypto";
import { PersistenceError } from "./persistence-error.js";

const INTEGRITY_KEY = "persistence-integrity";

export class PersistenceIntegrityManager {
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

    #digest(value) {
        return crypto
            .createHash("sha256")
            .update(JSON.stringify(value))
            .digest("hex");
    }

    async write(key, value) {
        if (typeof key !== "string" || key.length === 0) {
            throw new PersistenceError(
                "invalid_integrity_key",
                "invalid integrity key"
            );
        }

        await this.persistence.repository.save(
            key,
            value
        );

        await this.persistence.repository.save(
            INTEGRITY_KEY,
            {
                version: 1,
                updatedAt: Date.now(),
                entries: {
                    [key]: this.#digest(value)
                }
            }
        );

        return true;
    }

    async verify(key, value) {
        const record =
            await this.persistence.repository.load(
                INTEGRITY_KEY
            );

        if (record === null) {
            return false;
        }

        if (
            !record ||
            record.version !== 1 ||
            !record.entries ||
            typeof record.entries !== "object"
        ) {
            throw new PersistenceError(
                "invalid_integrity_state",
                "invalid persistence integrity state"
            );
        }

        const expected = record.entries[key];

        if (typeof expected !== "string") {
            return false;
        }

        const actual = this.#digest(value);

        return crypto.timingSafeEqual(
            Buffer.from(expected, "utf8"),
            Buffer.from(actual, "utf8")
        );
    }

    async verifyStored(key) {
        const value =
            await this.persistence.repository.load(key);

        if (value === null) {
            return false;
        }

        return this.verify(key, value);
    }
}
