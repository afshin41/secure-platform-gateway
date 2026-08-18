import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { FilePersistenceRepository } from "../src/persistence/file-persistence-repository.js";
import { PersistenceError } from "../src/persistence/persistence-error.js";

async function createRepository() {
    const directory =
        await fs.mkdtemp(
            path.join(
                os.tmpdir(),
                "secure-platform-gateway-persistence-"
            )
        );

    return {
        directory,
        repository:
            new FilePersistenceRepository({
                persistencePath: directory
            })
    };
}

test("persistence repository initializes durable storage", async () => {
    const {
        directory,
        repository
    } = await createRepository();

    try {
        assert.equal(
            await repository.initialize(),
            true
        );

        const stat =
            await fs.stat(directory);

        assert.equal(stat.isDirectory(), true);
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

test("persistence repository saves and loads state", async () => {
    const {
        directory,
        repository
    } = await createRepository();

    try {
        const state = {
            nodeId: "node-1",
            state: "authenticated",
            updatedAt: Date.now()
        };

        assert.equal(
            await repository.save(
                "security-state",
                state
            ),
            true
        );

        assert.equal(
            await repository.exists(
                "security-state"
            ),
            true
        );

        assert.deepEqual(
            await repository.load(
                "security-state"
            ),
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

test("missing state returns null", async () => {
    const {
        directory,
        repository
    } = await createRepository();

    try {
        assert.equal(
            await repository.load("missing"),
            null
        );

        assert.equal(
            await repository.exists("missing"),
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

test("delete removes persistent state", async () => {
    const {
        directory,
        repository
    } = await createRepository();

    try {
        await repository.save(
            "security-state",
            {
                value: true
            }
        );

        assert.equal(
            await repository.delete(
                "security-state"
            ),
            true
        );

        assert.equal(
            await repository.exists(
                "security-state"
            ),
            false
        );

        assert.equal(
            await repository.load(
                "security-state"
            ),
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

test("clear removes persistent JSON state", async () => {
    const {
        directory,
        repository
    } = await createRepository();

    try {
        await repository.save(
            "state-a",
            {
                value: 1
            }
        );

        await repository.save(
            "state-b",
            {
                value: 2
            }
        );

        assert.equal(
            await repository.clear(),
            true
        );

        assert.equal(
            await repository.exists("state-a"),
            false
        );

        assert.equal(
            await repository.exists("state-b"),
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

test("invalid persistence keys are rejected", async () => {
    const {
        directory,
        repository
    } = await createRepository();

    try {
        await assert.rejects(
            () =>
                repository.save(
                    "../escape",
                    {
                        value: true
                    }
                ),
            error =>
                error instanceof PersistenceError &&
                error.code === "invalid_key"
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

test("corrupt persistent state is rejected", async () => {
    const {
        directory,
        repository
    } = await createRepository();

    try {
        await repository.initialize();

        await fs.writeFile(
            path.join(
                directory,
                "corrupt.json"
            ),
            "{invalid-json",
            "utf8"
        );

        await assert.rejects(
            () =>
                repository.load("corrupt"),
            error =>
                error instanceof PersistenceError &&
                error.code === "corrupt_state"
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

test("save replaces existing state atomically", async () => {
    const {
        directory,
        repository
    } = await createRepository();

    try {
        await repository.save(
            "state",
            {
                version: 1
            }
        );

        await repository.save(
            "state",
            {
                version: 2
            }
        );

        assert.deepEqual(
            await repository.load("state"),
            {
                version: 2
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

test("non-serializable state is rejected", async () => {
    const {
        directory,
        repository
    } = await createRepository();

    try {
        await assert.rejects(
            () =>
                repository.save(
                    "state",
                    BigInt(1)
                ),
            error =>
                error instanceof PersistenceError &&
                error.code === "save_failed"
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
