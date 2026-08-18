import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { PersistenceRepository } from "./persistence-repository.js";
import { PersistenceError } from "./persistence-error.js";
import {
    createIntegrityDigest,
    verifyIntegrity
} from "./persistence-integrity.js";

const KEY_PATTERN = /^[A-Za-z0-9._-]+$/;

export class FilePersistenceRepository extends PersistenceRepository {
    constructor(config) {
        super();

        if (!config || typeof config !== "object") {
            throw new PersistenceError(
                "invalid_config",
                "invalid persistence configuration"
            );
        }

        if (
            typeof config.persistencePath !== "string" ||
            config.persistencePath.length === 0
        ) {
            throw new PersistenceError(
                "invalid_persistence_path",
                "invalid persistence path"
            );
        }

        this.directory =
            path.resolve(config.persistencePath);
    }

    validateKey(key) {
        if (
            typeof key !== "string" ||
            key.length === 0 ||
            !KEY_PATTERN.test(key)
        ) {
            throw new PersistenceError(
                "invalid_key",
                "invalid persistence key"
            );
        }

        return key;
    }

    filePath(key) {
        return path.join(
            this.directory,
            `${this.validateKey(key)}.json`
        );
    }

    async initialize() {
        try {
            await fs.mkdir(
                this.directory,
                {
                    recursive: true,
                    mode: 0o700
                }
            );

            return true;
        } catch (error) {
            throw new PersistenceError(
                "initialize_failed",
                "failed to initialize persistence",
                error
            );
        }
    }

    async save(key, value) {
        const file = this.filePath(key);
        const temporary =
            `${file}.${process.pid}.${crypto.randomBytes(8).toString("hex")}.tmp`;

        let payload;

        try {
            payload = JSON.stringify({
                version: 1,
                data: value,
                integrity: createIntegrityDigest(value)
            });

            if (payload === undefined) {
                throw new Error("non_serializable_value");
            }

            await this.initialize();

            await fs.writeFile(
                temporary,
                payload,
                {
                    encoding: "utf8",
                    mode: 0o600
                }
            );

            const handle =
                await fs.open(
                    temporary,
                    "r"
                );

            try {
                await handle.sync();
            } finally {
                await handle.close();
            }

            await fs.rename(
                temporary,
                file
            );

            await fs.chmod(
                file,
                0o600
            );

            const directoryHandle =
                await fs.open(
                    this.directory,
                    "r"
                );

            try {
                await directoryHandle.sync();
            } finally {
                await directoryHandle.close();
            }

            return true;
        } catch (error) {
            await fs.rm(
                temporary,
                {
                    force: true
                }
            ).catch(() => {});

            if (
                error instanceof PersistenceError
            ) {
                throw error;
            }

            throw new PersistenceError(
                "save_failed",
                "failed to save persistent state",
                error
            );
        }
    }

    async load(key) {
        const file = this.filePath(key);

        try {
            const payload =
                await fs.readFile(
                    file,
                    "utf8"
                );

            const record = JSON.parse(payload);

            if (
                !record ||
                record.version !== 1 ||
                !verifyIntegrity(
                    record.data,
                    record.integrity
                )
            ) {
                throw new PersistenceError(
                    "integrity_error",
                    "persistent state integrity validation failed"
                );
            }

            return record.data;
        } catch (error) {
            if (error?.code === "ENOENT") {
                return null;
            }

            if (
                error instanceof SyntaxError
            ) {
                throw new PersistenceError(
                    "corrupt_state",
                    "persistent state is invalid JSON",
                    error
                );
            }

            if (
                error instanceof PersistenceError &&
                error.code === "integrity_error"
            ) {
                throw error;
            }

            throw new PersistenceError(
                "load_failed",
                "failed to load persistent state",
                error
            );
        }
    }

    async exists(key) {
        const file = this.filePath(key);

        try {
            await fs.access(file);
            return true;
        } catch (error) {
            if (error?.code === "ENOENT") {
                return false;
            }

            throw new PersistenceError(
                "exists_failed",
                "failed to check persistent state",
                error
            );
        }
    }

    async delete(key) {
        const file = this.filePath(key);

        try {
            await fs.rm(
                file,
                {
                    force: true
                }
            );

            return true;
        } catch (error) {
            throw new PersistenceError(
                "delete_failed",
                "failed to delete persistent state",
                error
            );
        }
    }

    async clear() {
        try {
            await this.initialize();

            const entries =
                await fs.readdir(
                    this.directory,
                    {
                        withFileTypes: true
                    }
                );

            for (const entry of entries) {
                if (
                    entry.isFile() &&
                    entry.name.endsWith(".json")
                ) {
                    await fs.rm(
                        path.join(
                            this.directory,
                            entry.name
                        ),
                        {
                            force: true
                        }
                    );
                }
            }

            return true;
        } catch (error) {
            if (
                error instanceof PersistenceError
            ) {
                throw error;
            }

            throw new PersistenceError(
                "clear_failed",
                "failed to clear persistent state",
                error
            );
        }
    }
}
