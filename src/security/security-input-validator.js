export class SecurityInputValidator {
    constructor(config) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        this.config = config;

        this.maxNodeIdLength = 128;
        this.maxTokenLength = 512;
        this.maxSessionIdLength = 128;
        this.maxSignalTypeLength = 128;
        this.maxDeviceNameLength = 256;
        this.maxNodeTypeLength = 128;
    }

    requireString(
        value,
        field,
        maxLength
    ) {
        if (
            typeof value !== "string" ||
            value.length === 0 ||
            value.length > maxLength
        ) {
            throw new Error(
                `invalid_${field}`
            );
        }

        return value;
    }

    validateNodeId(nodeId) {
        return this.requireString(
            nodeId,
            "node_id",
            this.maxNodeIdLength
        );
    }

    validateAccessToken(accessToken) {
        return this.requireString(
            accessToken,
            "access_token",
            this.maxTokenLength
        );
    }

    validateEnrollmentToken(
        enrollmentToken
    ) {
        return this.requireString(
            enrollmentToken,
            "enrollment_token",
            this.maxTokenLength
        );
    }

    validateSessionId(sessionId) {
        return this.requireString(
            sessionId,
            "session_id",
            this.maxSessionIdLength
        );
    }

    validateSignalType(signalType) {
        return this.requireString(
            signalType,
            "signal_type",
            this.maxSignalTypeLength
        );
    }

    validateDeviceName(deviceName) {
        if (
            deviceName === undefined ||
            deviceName === null
        ) {
            return "";
        }

        return this.requireString(
            deviceName,
            "device_name",
            this.maxDeviceNameLength
        );
    }

    validateNodeType(nodeType) {
        if (
            nodeType === undefined ||
            nodeType === null
        ) {
            return "device";
        }

        return this.requireString(
            nodeType,
            "node_type",
            this.maxNodeTypeLength
        );
    }

    validateSessionTarget(targetNodeId) {
        return this.validateNodeId(
            targetNodeId
        );
    }

    validateSignalPayload(payload) {
        if (
            payload === undefined ||
            payload === null
        ) {
            throw new Error(
                "invalid_signal_payload"
            );
        }

        return payload;
    }

    validateNodeRegistration(payload) {
        if (
            !payload ||
            typeof payload !== "object" ||
            Array.isArray(payload)
        ) {
            throw new Error(
                "invalid_node_registration"
            );
        }

        return {
            nodeId: this.validateNodeId(
                payload.node_id
            ),

            deviceName:
                this.validateDeviceName(
                    payload.device_name
                ),

            nodeType:
                this.validateNodeType(
                    payload.node_type
                )
        };
    }

    validateSessionCreation(payload) {
        if (
            !payload ||
            typeof payload !== "object" ||
            Array.isArray(payload)
        ) {
            throw new Error(
                "invalid_session_creation"
            );
        }

        return {
            target:
                this.validateSessionTarget(
                    payload.target
                )
        };
    }

    validateSessionState(payload) {
        if (
            !payload ||
            typeof payload !== "object" ||
            Array.isArray(payload)
        ) {
            throw new Error(
                "invalid_session_state"
            );
        }

        return {
            sessionId:
                this.validateSessionId(
                    payload.session_id
                ),

            state:
                this.requireString(
                    payload.state,
                    "session_state",
                    64
                )
        };
    }

    validateSignal(payload) {
        if (
            !payload ||
            typeof payload !== "object" ||
            Array.isArray(payload)
        ) {
            throw new Error(
                "invalid_signal"
            );
        }

        return {
            sessionId:
                this.validateSessionId(
                    payload.session_id
                ),

            signalType:
                this.validateSignalType(
                    payload.signal_type
                ),

            payload:
                this.validateSignalPayload(
                    payload.payload
                )
        };
    }
}
