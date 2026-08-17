import crypto from "node:crypto";

import {
    SESSION_STATES
} from "../protocol/protocol.js";

export class SessionManager {
    constructor(config) {
        this.config = config;
        this.sessions = new Map();
    }

    cleanupExpired() {
        const current = Date.now();

        for (const [sessionId, session] of this.sessions) {
            if (session.expiresAt <= current) {
                this.sessions.delete(sessionId);
            }
        }
    }

    create(initiator, target) {
        this.cleanupExpired();

        if (this.sessions.size >= this.config.maxSessions) {
            throw new Error("session_capacity_reached");
        }

        const sessionId =
            `sess_${crypto.randomBytes(24).toString("base64url")}`;

        const current = Date.now();

        const session = {
            sessionId,
            initiator,
            target,
            state: SESSION_STATES.CREATED,
            createdAt: current,
            updatedAt: current,
            expiresAt:
                current +
                this.config.sessionTtlSeconds * 1000
        };

        this.sessions.set(sessionId, session);

        return session;
    }

    get(sessionId) {
        this.cleanupExpired();

        return this.sessions.get(sessionId) || null;
    }

    isParticipant(session, nodeId) {
        return (
            session.initiator === nodeId ||
            session.target === nodeId
        );
    }

    updateState(sessionId, nodeId, state) {
        const session = this.get(sessionId);

        if (!session) {
            throw new Error("session_not_found");
        }

        if (!this.isParticipant(session, nodeId)) {
            throw new Error("node_not_participant");
        }

        session.state = state;
        session.updatedAt = Date.now();

        return session;
    }

    close(sessionId, nodeId) {
        const session = this.get(sessionId);

        if (!session) {
            throw new Error("session_not_found");
        }

        if (!this.isParticipant(session, nodeId)) {
            throw new Error("node_not_participant");
        }

        session.state = SESSION_STATES.CLOSED;
        session.updatedAt = Date.now();

        this.sessions.delete(sessionId);

        return session;
    }

    removeNode(nodeId) {
        for (const [sessionId, session] of this.sessions) {
            if (this.isParticipant(session, nodeId)) {
                this.sessions.delete(sessionId);
            }
        }
    }

    clear() {
        this.sessions.clear();
    }

    count() {
        this.cleanupExpired();

        return this.sessions.size;
    }
}
