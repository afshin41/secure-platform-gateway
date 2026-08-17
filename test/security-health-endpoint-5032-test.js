import test from "node:test";
import assert from "node:assert/strict";

import http from "node:http";

import { createHttpRouter } from "../src/http/http-router.js";

test("50.32 health endpoint exposes runtime security state", async () => {
    const router = createHttpRouter(
        {
            serverName: "Secure Platform Gateway",
            serverVersion: "1.0.0"
        },
        {
            count: () => 3
        },
        () => 2,
        () => 3,
        () => ({
            status: "ok",
            security: {
                authenticatedNodes: 2,
                activeConnections: 2,
                rateLimitEntries: 1,
                replayEntries: 4,
                auditEvents: 7
            },
            timestamp: Date.now()
        })
    );

    const server = http.createServer(router);

    await new Promise(resolve => {
        server.listen(0, "127.0.0.1", resolve);
    });

    try {
        const address = server.address();

        const response = await fetch(
            `http://127.0.0.1:${address.port}/health`
        );

        assert.equal(response.status, 200);

        const health = await response.json();

        assert.equal(health.status, "healthy");
        assert.equal(health.service, "Secure Platform Gateway");
        assert.equal(health.version, "1.0.0");
        assert.equal(health.nodes, 2);
        assert.equal(health.sessions, 3);

        assert.equal(
            health.security.status,
            "ok"
        );

        assert.equal(
            health.security.security.authenticatedNodes,
            2
        );

        assert.equal(
            health.security.security.activeConnections,
            2
        );
    } finally {
        await new Promise(resolve => {
            server.close(resolve);
        });
    }
});
