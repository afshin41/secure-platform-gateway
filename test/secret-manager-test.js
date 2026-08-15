import assert from "node:assert/strict";
import { SecretManager } from "../src/security/secret-manager.js";

const strongSecret =
    "production-secret-0123456789-abcdef";

const testSecret =
    "test-token";

{
    const manager = new SecretManager({
        environment: "production",
        enrollmentToken: strongSecret
    });

    assert.equal(manager.isConfigured(), true);
    assert.equal(manager.isStrongEnough(), true);
    assert.equal(manager.validatePolicy(), true);

    assert.equal(
        manager.verify(strongSecret),
        true
    );

    assert.equal(
        manager.verify("wrong-secret"),
        false
    );

    const description =
        manager.describe();

    assert.equal(
        description.configured,
        true
    );

    assert.equal(
        description.strong,
        true
    );

    assert.equal(
        description.environment,
        "production"
    );

    assert.equal(
        Object.prototype.hasOwnProperty.call(
            description,
            "enrollmentToken"
        ),
        false
    );

    assert.equal(
        JSON.stringify(description).includes(
            strongSecret
        ),
        false
    );
}

{
    assert.throws(
        () =>
            new SecretManager({
                environment: "production",
                enrollmentToken: ""
            }).validatePolicy(),
        /missing_secret:enrollmentToken/
    );
}

{
    assert.throws(
        () =>
            new SecretManager({
                environment: "production",
                enrollmentToken: "short-secret"
            }).validatePolicy(),
        /weak_secret:enrollmentToken/
    );
}

{
    const manager = new SecretManager({
        environment: "test",
        enrollmentToken: testSecret
    });

    assert.equal(
        manager.validatePolicy(),
        true
    );

    assert.equal(
        manager.verify(testSecret),
        true
    );
}

{
    const manager = new SecretManager({
        environment: "production",
        enrollmentToken: strongSecret
    });

    manager.clear();

    assert.equal(
        manager.isConfigured(),
        false
    );

    assert.equal(
        manager.verify(strongSecret),
        false
    );
}

{
    assert.throws(
        () =>
            new SecretManager({
                environment: "invalid",
                enrollmentToken: strongSecret
            }),
        /invalid_secret_environment/
    );
}

{
    assert.throws(
        () =>
            new SecretManager({
                environment: "production",
                enrollmentToken: null
            }),
        /invalid_secret:enrollmentToken/
    );
}

console.log(
    "SECRET MANAGER TEST: ALL PASSED"
);
