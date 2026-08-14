import crypto from "node:crypto";

export class SecurityManager {
    constructor(config) {
        this.config = config;
        this.enrollmentToken =
            process.env.GATEWAY_ENROLLMENT_TOKEN || "";

        this.authenticatedNodes = new Map();
    }

    validateEnrollmentToken(token) {
        if (
            typeof token !== "string" ||
            token.length === 0 ||
            this.enrollmentToken.length === 0
        ) {
            return false;
        }

        const supplied =
            Buffer.from(token, "utf8");

        const expected =
            Buffer.from(
                this.enrollmentToken,
                "utf8"
            );

        if (supplied.length !== expected.length) {
            return false;
        }

        return crypto.timingSafeEqual(
            supplied,
            expected
        );
    }

    generateAccessToken() {
        return crypto.randomBytes(32).toString("base64url");
    }

    hashToken(token) {
        return crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");
    }

    authenticateNode(nodeId, enrollmentToken) {
        if (
            typeof nodeId !== "string" ||
            nodeId.length === 0
        ) {
            throw new Error("invalid_node_id");
        }

        if (
            !this.validateEnrollmentToken(
                enrollmentToken
            )
        ) {
            throw new Error(
                "invalid_enrollment_token"
            );
        }

        const accessToken =
            this.generateAccessToken();

        const tokenHash =
            this.hashToken(accessToken);

        const issuedAt = Date.now();

        this.authenticatedNodes.set(
            nodeId,
            {
                nodeId,
                tokenHash,
                issuedAt
            }
        );

        return {
            accessToken,
            issuedAt
        };
    }

    validateAccessToken(nodeId, accessToken) {
        if (
            typeof nodeId !== "string" ||
            typeof accessToken !== "string" ||
            accessToken.length === 0
        ) {
            return false;
        }

        const record =
            this.authenticatedNodes.get(nodeId);

        if (!record) {
            return false;
        }

        const suppliedHash =
            this.hashToken(accessToken);

        const supplied =
            Buffer.from(
                suppliedHash,
                "hex"
            );

        const expected =
            Buffer.from(
                record.tokenHash,
                "hex"
            );

        if (supplied.length !== expected.length) {
            return false;
        }

        return crypto.timingSafeEqual(
            supplied,
            expected
        );
    }

    revokeNode(nodeId) {
        this.authenticatedNodes.delete(nodeId);
    }

    revokeAll() {
        this.authenticatedNodes.clear();
    }

    count() {
        return this.authenticatedNodes.size;
    }
}
