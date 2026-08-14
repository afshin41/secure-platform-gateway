import crypto from "node:crypto";

export class SecurityAuditManager {
    constructor(config) {
        if (!config || typeof config !== "object") {
            throw new Error("invalid_config");
        }

        this.config = config;
        this.events = [];
        this.sequence = 0;
    }

    record(
        eventType,
        nodeId = null,
        metadata = {}
    ) {
        if (
            typeof eventType !== "string" ||
            eventType.length === 0
        ) {
            throw new Error("invalid_event_type");
        }

        if (
            nodeId !== null &&
            (
                typeof nodeId !== "string" ||
                nodeId.length === 0
            )
        ) {
            throw new Error("invalid_node_id");
        }

        if (
            metadata === null ||
            typeof metadata !== "object" ||
            Array.isArray(metadata)
        ) {
            throw new Error("invalid_event_metadata");
        }

        const event = Object.freeze({
            id:
                `audit_${crypto.randomBytes(16).toString("hex")}`,
            sequence: ++this.sequence,
            eventType,
            nodeId,
            metadata: Object.freeze({
                ...metadata
            }),
            timestamp: Date.now()
        });

        this.events.push(event);

        return event;
    }

    recordAuthentication(
        nodeId,
        success
    ) {
        return this.record(
            success
                ? "authentication.success"
                : "authentication.failure",
            nodeId,
            {
                success: Boolean(success)
            }
        );
    }

    recordAuthorization(
        nodeId,
        resource,
        success
    ) {
        return this.record(
            success
                ? "authorization.success"
                : "authorization.failure",
            nodeId,
            {
                resource,
                success: Boolean(success)
            }
        );
    }

    recordSecurityViolation(
        nodeId,
        reason
    ) {
        if (
            typeof reason !== "string" ||
            reason.length === 0
        ) {
            throw new Error(
                "invalid_violation_reason"
            );
        }

        return this.record(
            "security.violation",
            nodeId,
            {
                reason
            }
        );
    }

    getRecent(limit = 100) {
        if (
            !Number.isInteger(limit) ||
            limit <= 0
        ) {
            throw new Error("invalid_limit");
        }

        return this.events
            .slice(-limit)
            .map(event => ({
                ...event,
                metadata: {
                    ...event.metadata
                }
            }));
    }

    count() {
        return this.events.length;
    }

    clear() {
        this.events.length = 0;
    }
}
