import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { FilePersistenceRepository } from "../src/persistence/file-persistence-repository.js";
import { PersistenceManager } from "../src/persistence/persistence-manager.js";

async function createManager() {
    const directory =
        await fs.mkdtemp(
            path.join(
                os.tmpdir(),
                "secure-platform-gateway-runtime-"
            )
        );

    const repository =
        new FilePersistenceRepository({
            persistencePath: directory
        });

    return {
        directory,
        manager:
            new PersistenceManager(
                { persistencePath: directory },
                repository
            )
    };
}

test("persistence manager initializes runtime storage", async () => {
    const { directory, manager } =
        await createManager();

    try {
        assert.equal(
            await manager.initialize(),
            true
        );

        assert.deepEqual(
            manager.getStatus(),
            {
                initialized: true,
                healthy: true,
                lastError: null
            }
        );
    } finally {
        await fs.rm(
            directory,
            {
                recursive: true,
                force: true
            }
        );
    }
});

test("persistence manager saves and restores runtime state", async () => {
    const { directory, manager } =
        await createManager();

    try {
        await manager.initialize();

        const state = {
            serverVersion: "1.0.0",
            startedAt: 123456789,
            cleanShutdown: false
        };

        assert.equal(
            await manager.saveRuntimeState(state),
            true
        );

        assert.deepEqual(
            await manager.loadRuntimeState(),
            state
        );
    } finally {
        await fs.rm(
            directory,
            {
                recursive: true,
                force: true
            }
        );
    }
});

test("missing runtime state returns null", async () => {
    const { directory, manager } =
        await createManager();

    try {
        await manager.initialize();

        assert.equal(
            await manager.loadRuntimeState(),
            null
        );
    } finally {
        await fs.rm(
            directory,
            {
                recursive: true,
                force: true
            }
        );
    }
});

test("persistence manager reports clean shutdown state", async () => {
    const { directory, manager } =
        await createManager();

    try {
        await manager.initialize();

        assert.equal(
            await manager.shutdown(),
            true
        );

        assert.equal(
            manager.getStatus().initialized,
            false
        );
    } finally {
        await fs.rm(
            directory,
            {
                recursive: true,
                force: true
            }
        );
    }
});
