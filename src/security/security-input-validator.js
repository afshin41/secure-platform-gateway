export class SecurityInputValidator {
    constructor(config) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        this.config = config;

        this.maxNodeIdLength = 128;
        this.maxSessionIdLength = 128;
        this.maxSignalTypeLength = 128;
        this.maxTokenLength = 512;
        this.maxStringLength = 4096;
    }

    requireString(
        value,
        name,
        maxLength = this.maxStringLength
    ) {
        if (
            typeof value !== "string" ||
            value.length === 0 ||
            value.length > maxLength
        ) {
            throw new Error(
                `invalid_${name}`
            );
        }

        return value;
    }

    nodeId(value) {
        return this.requireString(
            value,
            "node_id",
            this.maxNodeIdLength
        );
    }

    sessionId(value) {
        return this.requireString(
            value,
            "session_id",
            this.maxSessionIdLength
        );
    }

    accessToken(value) {
        return this.requireString(
            value,
            "access_token",
            this.maxTokenLength
        );
    }

    enrollmentToken(value) {
        return this.requireString(
            value,
            "enrollment_token",
            this.maxTokenLength
        );
    }

    signalType(value) {
        return this.requireString(
            value,
            "signal_type",
            this.maxSignalTypeLength
        );
    }

    deviceName(value) {
        if (value === undefined || value === null) {
            return "";
        }

        return this.requireString(
            value,
            "device_name",
            this.maxStringLength
        );
    }

    nodeType(value) {
        if (value === undefined || value === null) {
            return "device";
        }

        return this.requireString(
            value,
            "node_type",
            128
        );
    }

    signalPayload(value) {
        if (
            value === undefined ||
            value === null
        ) {
            throw new Error(
                "invalid_signal_payload"
            );
        }

        if (
            typeof value !== "object" &&
            typeof value !== "string" &&
            typeof value !== "number" &&
            typeof value !== "boolean"
        ) {
            throw new Error(
                "invalid_signal_payload"
            );
        }

        return value;
    }

    requestId(value) {
        if (
            value === undefined ||
            value === null
        ) {
            return null;
        }

        return this.requireString(
            value,
            "request_id",
            128
        );
    }
}
