import crypto from "node:crypto";

export class SignalingService {
    constructor(config, sessionManager) {
        this.config = config;
        this.sessionManager = sessionManager;
        this.messages = new Map();
    }

    send(sessionId, sender, type, payload) {
        const session = this.sessionManager.get(sessionId);

        if (!session) {
            throw new Error("session_not_found");
        }

        if (!this.sessionManager.isParticipant(session, sender)) {
            throw new Error("sender_not_participant");
        }

        const message = {
            id: `sig_${crypto.randomBytes(24).toString("base64url")}`,
            session_id: sessionId,
            sender,
            type,
            payload,
            created_at: Date.now()
        };

        let queue = this.messages.get(sessionId);

        if (!queue) {
            queue = [];
            this.messages.set(sessionId, queue);
        }

        queue.push(message);

        return message;
    }

    receive(sessionId, receiver) {
        const session = this.sessionManager.get(sessionId);

        if (!session) {
            throw new Error("session_not_found");
        }

        if (!this.sessionManager.isParticipant(session, receiver)) {
            throw new Error("receiver_not_participant");
        }

        const queue = this.messages.get(sessionId) || [];

        return queue.filter(
            message => message.sender !== receiver
        );
    }

    removeSession(sessionId) {
        this.messages.delete(sessionId);
    }
}
