import test from "node:test";
import assert from "node:assert/strict";

import {
    createSecurityHealthEndpoint
} from "../src/security/security-health-endpoint.js";

test("50.28 security health endpoint returns health status", () => {
    const security = {
        securityManager: {
            count: () => 1
        },
        connectionGuard: {
            count: () => 2
        },
        rateLimiter: {
            count: () => 3
        },
        replayProtection: {
            count: () => 4
        },
        auditManager: {
            count: () => 5
        }
    };

    const getHealth =
        createSecurityHealthEndpoint(
            {},
            security
        );

    const result = getHealth();

    assert.equal(result.status, "ok");
    assert.deepEqual(
        result.security,
        {
            authenticatedNodes: 1,
            activeConnections: 2,
            rateLimitEntries: 3,
            replayEntries: 4,
            auditEvents: 5
        }
    );
});
