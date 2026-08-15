import crypto from "node:crypto";

const MIN_SECRET_LENGTH = 32;

const TEST_SECRET_VALUES = new Set([
    "test-token",
    "integration-test-token"
]);

export class SecretManager {
    constructor({
        environment,
        enrollmentToken
    }) {
        if (
            environment !== "development" &&
            environment !== "test" &&
            environment !== "production"
        ) {
            throw new Error(
                "invalid_secret_environment"
            );
        }

        if (typeof enrollmentToken !== "string") {
            throw new Error(
                "invalid_secret:enrollmentToken"
            );
        }

        this.environment = environment;

        this.enrollmentToken =
            enrollmentToken;
    }

    isConfigured() {
        return this.enrollmentToken.length > 0;
    }

    isStrongEnough() {
        return (
            this.enrollmentToken.length >=
            MIN_SECRET_LENGTH
        );
    }

    validatePolicy() {
        if (!this.isConfigured()) {
            if (
                this.environment === "production"
            ) {
                throw new Error(
                    "missing_secret:enrollmentToken"
                );
            }

            return true;
        }

        if (
            this.environment === "production" &&
            !this.isStrongEnough()
        ) {
            throw new Error(
                "weak_secret:enrollmentToken"
            );
        }

        if (
            this.environment !== "production" &&
            TEST_SECRET_VALUES.has(
                this.enrollmentToken
            )
        ) {
            return true;
        }

        if (!this.isStrongEnough()) {
            throw new Error(
                "weak_secret:enrollmentToken"
            );
        }

        return true;
    }

    verify(candidate) {
        if (
            typeof candidate !== "string" ||
            candidate.length === 0 ||
            !this.isConfigured()
        ) {
            return false;
        }

        const supplied =
            Buffer.from(candidate, "utf8");

        const expected =
            Buffer.from(
                this.enrollmentToken,
                "utf8"
            );

        if (
            supplied.length !==
            expected.length
        ) {
            return false;
        }

        return crypto.timingSafeEqual(
            supplied,
            expected
        );
    }

    describe() {
        return Object.freeze({
            configured: this.isConfigured(),
            strong: this.isStrongEnough(),
            environment: this.environment
        });
    }

    clear() {
        this.enrollmentToken = "";
    }
}
