import assert from "node:assert/strict";
import test from "node:test";
import { validateConfig } from "../src/config/config-validator.js";

const baseConfig = {
    environment: "production",
    host: "0.0.0.0",
    port: 10000,
    nodeTtlSeconds: 120,
    sessionTtlSeconds: 300,
    maxNodes: 10000,
    maxSessions: 10000,
    maxMessageBytes: 1024 * 1024,
    maxWebSocketConnections: 10000,
    httpHeadersTimeoutMs: 10000,
    httpRequestTimeoutMs: 30000,
    httpKeepAliveTimeoutMs: 5000,
    shutdownTimeoutMs: 10000,
    serverName: "Secure Platform Gateway",
    serverVersion: "1.0.0",
    enrollmentToken: "production-secret"
};

test("production configuration accepts valid network limits", () => {
    assert.equal(validateConfig(baseConfig), true);
});

test("rejects WebSocket capacity above node capacity", () => {
    assert.throws(
        () =>
            validateConfig({
                ...baseConfig,
                maxWebSocketConnections: 10001
            }),
        /invalid_configuration:maxWebSocketConnections/
    );
});

test("rejects headers timeout above request timeout", () => {
    assert.throws(
        () =>
            validateConfig({
                ...baseConfig,
                httpHeadersTimeoutMs: 40000
            }),
        /invalid_configuration:httpHeadersTimeoutMs/
    );
});
