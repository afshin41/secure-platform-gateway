import test from "node:test";
import assert from "node:assert/strict";

import { SecurityHealthManager } from "../src/security/security-health-manager.js";

test("50.27 security health reports runtime security state", () => {
    const security = {
        securityManager: {
            count: () => 3
        },
        connectionGuard: {
            count: () => 2
        },
        rateLimiter: {
            count: () => 5
        },
        replayProtection: {
            count: () => 7
        },
        auditManager: {
            count: () => 11
        }
    };

    const manager =
        new SecurityHealthManager(
            {},
            security
        );

    const result =
        manager.getStatus();

    assert.equal(result.status, "ok");
    assert.deepEqual(
        result.security,
        {
            authenticatedNodes: 3,
            activeConnections: 2,
            rateLimitEntries: 5,
            replayEntries: 7,
            auditEvents: 11
        }
    );

    assert.equal(
        typeof result.timestamp,
        "number"
    );
});

test("50.27 security health rejects invalid configuration", () => {
    assert.throws(
        () =>
            new SecurityHealthManager(
                null,
                {}
            ),
        /invalid_config/
    );
});

test("50.27 security health rejects invalid security integration", () => {
    assert.throws(
        () =>
            new SecurityHealthManager(
                {},
                null
            ),
        /invalid_security/
    );
});
