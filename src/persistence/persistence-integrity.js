import crypto from "node:crypto";

export function createIntegrityDigest(value) {
    return crypto
        .createHash("sha256")
        .update(
            JSON.stringify(value),
            "utf8"
        )
        .digest("hex");
}

export function verifyIntegrity(
    value,
    digest
) {
    if (
        typeof digest !== "string" ||
        digest.length !== 64
    ) {
        return false;
    }

    const actual =
        createIntegrityDigest(value);

    return crypto.timingSafeEqual(
        Buffer.from(actual, "utf8"),
        Buffer.from(digest, "utf8")
    );
}
