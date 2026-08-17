import { SecurityHealthManager } from "./security-health-manager.js";

export function createSecurityHealthEndpoint(
    config,
    security
) {
    const healthManager =
        new SecurityHealthManager(
            config,
            security
        );

    return () => healthManager.getStatus();
}
