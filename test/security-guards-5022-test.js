import test from "node:test";
import assert from "node:assert/strict";

import { SecurityRequestGuard } from "../src/security/security-request-guard.js";
import { SecuritySessionGuard } from "../src/security/security-session-guard.js";
import { SecuritySignalingGuard } from "../src/security/security-signaling-guard.js";

function validator() {
    return {
        nodeId: value => {
            if (typeof value !== "string" || !value) {
                throw new Error("invalid_node_id");
            }
            return value;
        },
        accessToken: value => {
            if (typeof value !== "string" || !value) {
                throw new Error("invalid_access_token");
            }
            return value;
        },
        sessionId: value => {
            if (typeof value !== "string" || !value) {
                throw new Error("invalid_session_id");
            }
            return value;
        },
        signalType: value => value,
        signalPayload: value => value
    };
}

function policy() {
    return {
        requireAuthentication: () => true,
        requireAccessToken: () => true,
        requireRegisteredNode: () => true,
        requireSessionAuthorization: () => true,
        requireSignalingAuthorization: () => true,
        preventSelfSession: () => true
    };
}

test("50.22 request guard validates node request", () => {
    const calls = [];

    const guard = new SecurityRequestGuard(
        {},
        validator(),
        policy(),
        {
            consume: key => calls.push(key)
        }
    );

    const result = guard.validateNodeRequest(
        "node-1",
        "token-1"
    );

    assert.deepEqual(result, {
        nodeId: "node-1",
        accessToken: "token-1"
    });

    assert.deepEqual(calls, ["node:node-1"]);
});

test("50.22 request guard validates session request", () => {
    const guard = new SecurityRequestGuard(
        {},
        validator(),
        policy(),
        { consume() {} }
    );

    assert.deepEqual(
        guard.validateSessionRequest(
            "node-1",
            "token-1",
            "session-1"
        ),
        {
            nodeId: "node-1",
            accessToken: "token-1",
            sessionId: "session-1"
        }
    );
});

test("50.22 request guard validates signal request", () => {
    const guard = new SecurityRequestGuard(
        {},
        validator(),
        policy(),
        { consume() {} }
    );

    assert.deepEqual(
        guard.validateSignalRequest(
            "node-1",
            "token-1",
            "session-1",
            "offer",
            { sdp: "data" }
        ),
        {
            nodeId: "node-1",
            accessToken: "token-1",
            sessionId: "session-1",
            signalType: "offer",
            payload: { sdp: "data" }
        }
    );
});

test("50.22 session guard authorizes session", () => {
    const calls = [];
    const guard = new SecuritySessionGuard(
        {},
        policy(),
        {
            authorizeNode: () => true,
            authorizeSession: () => {
                calls.push("authorizeSession");
                return true;
            }
        },
        {
            recordAuthorization: (...args) =>
                calls.push(args)
        }
    );

    assert.equal(
        guard.authorizeSession(
            "node-1",
            "token-1",
            "session-1"
        ),
        true
    );

    assert.equal(calls[0], "authorizeSession");
    assert.deepEqual(calls[1], [
        "node-1",
        "session:session-1",
        true
    ]);
});

test("50.22 session guard rejects unauthorized session", () => {
    const audit = [];

    const guard = new SecuritySessionGuard(
        {},
        policy(),
        {
            authorizeSession: () => false
        },
        {
            recordAuthorization: (...args) =>
                audit.push(args)
        }
    );

    assert.throws(
        () =>
            guard.authorizeSession(
                "node-1",
                "token-1",
                "session-1"
            ),
        {
            message: "session_not_authorized"
        }
    );

    assert.deepEqual(audit, [
        [
            "node-1",
            "session:session-1",
            false
        ]
    ]);
});

test("50.22 signaling guard authorizes send and receive", () => {
    const calls = [];

    const guard = new SecuritySignalingGuard(
        {},
        policy(),
        {
            authorizeSignalSend: () => {
                calls.push("send");
                return true;
            },
            authorizeSignalReceive: () => {
                calls.push("receive");
                return true;
            }
        },
        {
            recordAuthorization() {}
        }
    );

    assert.equal(
        guard.authorizeSend(
            "node-1",
            "token-1",
            "session-1"
        ),
        true
    );

    assert.equal(
        guard.authorizeReceive(
            "node-1",
            "token-1",
            "session-1"
        ),
        true
    );

    assert.deepEqual(calls, [
        "send",
        "receive"
    ]);
});

test("50.22 signaling guard rejects unauthorized send", () => {
    const audit = [];

    const guard = new SecuritySignalingGuard(
        {},
        policy(),
        {
            authorizeSignalSend: () => false,
            authorizeSignalReceive: () => true
        },
        {
            recordAuthorization: (...args) =>
                audit.push(args)
        }
    );

    assert.throws(
        () =>
            guard.authorizeSend(
                "node-1",
                "token-1",
                "session-1"
            ),
        {
            message: "signal_send_not_authorized"
        }
    );

    assert.deepEqual(audit, [
        [
            "node-1",
            "signal.send:session-1",
            false
        ]
    ]);
});

test("50.22 security integration exposes all guards", async () => {
    const { createSecurityIntegration } =
        await import(
            "../src/security/security-integration.js"
        );

    const sessionManager = {
        get() {
            return null;
        },
        create() {
            return {};
        },
        isParticipant() {
            return false;
        }
    };

    const config = {
        environment: "test",
        enrollmentToken: "test-token",
        securityRateWindowMs: 60000,
        securityRateMaxRequests: 100,
        securityReplayTtlMs: 300000,
        securityReplayMaxEntries: 1000
    };

    const security =
        createSecurityIntegration(
            config,
            sessionManager
        );

    assert.ok(security.requestGuard);
    assert.ok(security.sessionGuard);
    assert.ok(security.signalingGuard);
});
