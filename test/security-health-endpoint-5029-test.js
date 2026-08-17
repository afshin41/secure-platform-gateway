import test from "node:test";
import assert from "node:assert/strict";

import {
    createSecurityHealthEndpoint
} from "../src/security/security-health-endpoint.js";

test("50.29 health endpoint returns valid security state", () => {
    const security = {
        securityManager: { count: () => 4 },
        connectionGuard: { count: () => 3 },
        rateLimiter: { count: () => 2 },
        replayProtection: { count: () => 1 },
        auditManager: { count: () => 9 }
    };

    const health =
        createSecurityHealthEndpoint({}, security);

    const result = health();

    assert.equal(result.status, "ok");
    assert.equal(
        result.security.authenticatedNodes,
        4
    );
    assert.equal(
        result.security.activeConnections,
        3
    );
    assert.equal(
        result.security.rateLimitEntries,
        2
    );
    assert.equal(
        result.security.replayEntries,
        1
    );
    assert.equal(
        result.security.auditEvents,
        9
    );
    assert.equal(
        typeof result.timestamp,
        "number"
    );
});
