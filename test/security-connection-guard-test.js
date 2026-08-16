import test from "node:test";
import assert from "node:assert/strict";

import { SecurityConnectionGuard } from "../src/security/security-connection-guard.js";

const createDependencies = () => {
    const calls = {
        authentication: 0,
        rateLimit: [],
        violations: []
    };

    const policy = {
        requireAuthentication() {
            calls.authentication++;
            return true;
        }
    };

    const rateLimiter = {
        consume(key) {
            calls.rateLimit.push(key);
            return true;
        }
    };

    const auditManager = {
        recordSecurityViolation(nodeId, reason) {
            calls.violations.push({
                nodeId,
                reason
            });
        }
    };

    return {
        calls,
        policy,
        rateLimiter,
        auditManager
    };
};

const createGuard = () => {
    const dependencies = createDependencies();

    const guard = new SecurityConnectionGuard(
        {
            environment: "production"
        },
        dependencies.policy,
        dependencies.rateLimiter,
        dependencies.auditManager
    );

    return {
        guard,
        ...dependencies
    };
};

test(
    "connection guard accepts valid connection",
    () => {
        const { guard, calls } = createGuard();

        assert.equal(
            guard.accept("node-1"),
            true
        );

        assert.equal(
            guard.count(),
            1
        );

        assert.equal(
            calls.authentication,
            1
        );

        assert.deepEqual(
            calls.rateLimit,
            ["connection:node-1"]
        );
    }
);

test(
    "connection guard rejects invalid connection id",
    () => {
        const { guard } = createGuard();

        assert.throws(
            () => guard.accept(""),
            {
                message: "invalid_connection_id"
            }
        );

        assert.throws(
            () => guard.accept(null),
            {
                message: "invalid_connection_id"
            }
        );

        assert.throws(
            () => guard.requireAccepted(""),
            {
                message: "invalid_connection_id"
            }
        );
    }
);

test(
    "connection guard requires accepted connection",
    () => {
        const { guard } = createGuard();

        assert.equal(
            guard.accept("node-2"),
            true
        );

        assert.equal(
            guard.requireAccepted("node-2"),
            true
        );
    }
);

test(
    "connection guard rejects unaccepted connection and audits violation",
    () => {
        const { guard, calls } = createGuard();

        assert.throws(
            () => guard.requireAccepted("node-unknown"),
            {
                message: "connection_not_accepted"
            }
        );

        assert.deepEqual(
            calls.violations,
            [
                {
                    nodeId: null,
                    reason: "connection_not_accepted"
                }
            ]
        );
    }
);

test(
    "connection guard removes connection",
    () => {
        const { guard } = createGuard();

        guard.accept("node-3");

        assert.equal(
            guard.count(),
            1
        );

        guard.remove("node-3");

        assert.equal(
            guard.count(),
            0
        );

        assert.throws(
            () => guard.requireAccepted("node-3"),
            {
                message: "connection_not_accepted"
            }
        );
    }
);

test(
    "connection guard clear removes all connections",
    () => {
        const { guard } = createGuard();

        guard.accept("node-4");
        guard.accept("node-5");
        guard.accept("node-6");

        assert.equal(
            guard.count(),
            3
        );

        guard.clear();

        assert.equal(
            guard.count(),
            0
        );

        assert.throws(
            () => guard.requireAccepted("node-4"),
            {
                message: "connection_not_accepted"
            }
        );
    }
);

test(
    "connection guard replaces existing connection record safely",
    () => {
        const { guard, calls } = createGuard();

        guard.accept("node-7");
        guard.accept("node-7");

        assert.equal(
            guard.count(),
            1
        );

        assert.equal(
            calls.authentication,
            2
        );

        assert.deepEqual(
            calls.rateLimit,
            [
                "connection:node-7",
                "connection:node-7"
            ]
        );
    }
);
