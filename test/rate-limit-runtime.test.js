import assert from "node:assert/strict";
import test from "node:test";
import { SecurityRateLimiter } from "../src/security/security-rate-limiter.js";

test("rate limiter enforces configured request capacity", () => {
    const limiter = new SecurityRateLimiter({
        securityRateWindowMs: 1000,
        securityRateMaxRequests: 2
    });

    const first = limiter.consume("node:test");
    const second = limiter.consume("node:test");

    assert.equal(first.allowed, true);
    assert.equal(first.remaining, 1);

    assert.equal(second.allowed, true);
    assert.equal(second.remaining, 0);

    assert.throws(
        () => limiter.consume("node:test"),
        /rate_limit_exceeded/
    );
});

test("rate limiter isolates independent keys", () => {
    const limiter = new SecurityRateLimiter({
        securityRateWindowMs: 1000,
        securityRateMaxRequests: 1
    });

    assert.equal(
        limiter.consume("node:a").allowed,
        true
    );

    assert.equal(
        limiter.consume("node:b").allowed,
        true
    );

    assert.throws(
        () => limiter.consume("node:a"),
        /rate_limit_exceeded/
    );

    assert.throws(
        () => limiter.consume("node:b"),
        /rate_limit_exceeded/
    );
});

test("rate limiter reset restores capacity", () => {
    const limiter = new SecurityRateLimiter({
        securityRateWindowMs: 1000,
        securityRateMaxRequests: 1
    });

    limiter.consume("node:test");

    assert.throws(
        () => limiter.consume("node:test"),
        /rate_limit_exceeded/
    );

    limiter.reset("node:test");

    assert.equal(
        limiter.consume("node:test").allowed,
        true
    );
});
