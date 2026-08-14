import { SecurityManager } from "./security-manager.js";

export class SecurityManagerFactory {
    static create(config = {}) {
        return new SecurityManager(config);
    }
}
