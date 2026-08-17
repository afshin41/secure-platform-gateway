import test from "node:test";
import assert from "node:assert/strict";

import { SecurityLifecycleManager } from "../src/security/security-lifecycle-manager.js";

function createMock() {
    let replayCleared = false;
    let rateCleared = false;
    let nodesRevoked = false;
    let sessionsCleared = false;
    let signalingCleared = false;

    const security = {
        replayProtection: {
            clear() {
                replayCleared = true;
            }
        },
        rateLimiter: {
            clear() {
                rateCleared = true;
            }
        },
        nodeLifecycleManager: {
            revokeAll() {
                nodesRevoked = true;
            }
        }
    };

    const sessionManager = {
        clear() {
            sessionsCleared = true;
        }
    };

    const signalingService = {
        clear() {
            signalingCleared = true;
        }
    };

    return {
        manager: new SecurityLifecycleManager(
            {},
            security,
            sessionManager,
            signalingService
        ),
        state() {
            return {
                replayCleared,
                rateCleared,
                nodesRevoked,
                sessionsCleared,
                signalingCleared
            };
        }
    };
}

test("50.26 lifecycle starts correctly", () => {
    const { manager } = createMock();

    assert.equal(manager.isStarted(), false);
    assert.equal(manager.isStopped(), false);

    assert.equal(manager.start(), true);

    assert.equal(manager.isStarted(), true);
    assert.equal(manager.isStopped(), false);
});

test("50.26 lifecycle shutdown clears security and runtime state", () => {
    const { manager, state } = createMock();

    manager.start();

    assert.equal(manager.shutdown(), true);

    assert.deepEqual(state(), {
        replayCleared: true,
        rateCleared: true,
        nodesRevoked: true,
        sessionsCleared: true,
        signalingCleared: true
    });

    assert.equal(manager.isStarted(), false);
    assert.equal(manager.isStopped(), true);
});

test("50.26 lifecycle shutdown is idempotent", () => {
    const { manager } = createMock();

    manager.start();

    assert.equal(manager.shutdown(), true);
    assert.equal(manager.shutdown(), false);
});

test("50.26 stopped lifecycle cannot restart", () => {
    const { manager } = createMock();

    manager.start();
    manager.shutdown();

    assert.throws(
        () => manager.start(),
        /security_lifecycle_stopped/
    );
});
