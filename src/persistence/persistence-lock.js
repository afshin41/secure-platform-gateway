import fs from "node:fs/promises";
import path from "node:path";

import { PersistenceError } from "./persistence-error.js";

export class PersistenceLock {
    constructor(persistencePath) {
        if (
            typeof persistencePath !== "string" ||
            persistencePath.length === 0
        ) {
            throw new PersistenceError(
                "invalid_persistence_path",
                "invalid persistence path"
            );
        }

        this.lockPath = path.join(
            path.resolve(persistencePath),
            ".persistence.lock"
        );

        this.locked = false;
    }

    async acquire() {
        if (this.locked) {
            return true;
        }

        try {
            await fs.mkdir(
                path.dirname(this.lockPath),
                {
                    recursive: true,
                    mode: 0o700
                }
            );

            const handle = await fs.open(
                this.lockPath,
                "wx",
                0o600
            );

            await handle.writeFile(
                `${process.pid}\n${Date.now()}\n`,
                "utf8"
            );

            await handle.close();

            this.locked = true;

            return true;
        } catch (error) {
            if (error?.code === "EEXIST") {
                throw new PersistenceError(
                    "persistence_locked",
                    "persistence storage is locked",
                    error
                );
            }

            throw new PersistenceError(
                "lock_failed",
                "failed to acquire persistence lock",
                error
            );
        }
    }

    async release() {
        if (!this.locked) {
            return false;
        }

        try {
            await fs.rm(
                this.lockPath,
                { force: true }
            );

            this.locked = false;

            return true;
        } catch (error) {
            throw new PersistenceError(
                "unlock_failed",
                "failed to release persistence lock",
                error
            );
        }
    }
}
