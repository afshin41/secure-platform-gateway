export class PersistenceError extends Error {
    constructor(code, message, cause = null) {
        super(message);
        this.name = "PersistenceError";
        this.code = code;
        this.cause = cause;
    }
}
