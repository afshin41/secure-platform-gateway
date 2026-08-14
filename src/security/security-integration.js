import { SecurityManager } from "./security-manager.js";
import { AuthenticationManager } from "./authentication-manager.js";
import { SecurityAuditManager } from "./security-audit-manager.js";
import { AuthorizationManager } from "./authorization-manager.js";
import { SecurityPolicyManager } from "./security-policy-manager.js";
import { SecurityRateLimiter } from "./security-rate-limiter.js";
import { SecurityInputValidator } from "./security-input-validator.js";
import { SecurityReplayProtection } from "./security-replay-protection.js";
import { SecurityNodeLifecycleManager } from "./security-node-lifecycle-manager.js";
import { SecuritySessionLifecycleManager } from "./security-session-lifecycle-manager.js";
import { SecurityGatewayGuard } from "./security-gateway-guard.js";

export function createSecurityIntegration(
    config,
    sessionManager
) {
    if (!config || typeof config !== "object") {
        throw new Error("invalid_config");
    }

    if (
        !sessionManager ||
        typeof sessionManager.get !== "function" ||
        typeof sessionManager.create !== "function" ||
        typeof sessionManager.isParticipant !== "function"
    ) {
        throw new Error(
            "invalid_session_manager"
        );
    }

    const securityManager =
        new SecurityManager(config);

    const authenticationManager =
        new AuthenticationManager(
            config,
            securityManager
        );

    const auditManager =
        new SecurityAuditManager(config);

    const authorizationManager =
        new AuthorizationManager(
            config,
            securityManager,
            sessionManager
        );

    const policyManager =
        new SecurityPolicyManager(config);

    const rateLimiter =
        new SecurityRateLimiter({
            ...config,
            securityRateWindowMs:
                config.securityRateWindowMs ??
                60 * 1000,
            securityRateMaxRequests:
                config.securityRateMaxRequests ??
                100
        });

    const inputValidator =
        new SecurityInputValidator(config);

    const replayProtection =
        new SecurityReplayProtection({
            ...config,
            securityReplayTtlMs:
                config.securityReplayTtlMs ??
                5 * 60 * 1000,
            securityReplayMaxEntries:
                config.securityReplayMaxEntries ??
                100000
        });

    const nodeLifecycleManager =
        new SecurityNodeLifecycleManager(
            config,
            securityManager,
            authenticationManager
        );

    const sessionLifecycleManager =
        new SecuritySessionLifecycleManager(
            config,
            sessionManager,
            nodeLifecycleManager
        );

    const gatewayGuard =
        new SecurityGatewayGuard(
            config,
            policyManager,
            inputValidator,
            replayProtection,
            rateLimiter,
            nodeLifecycleManager,
            sessionLifecycleManager
        );

    return Object.freeze({
        securityManager,
        authenticationManager,
        auditManager,
        authorizationManager,
        policyManager,
        rateLimiter,
        inputValidator,
        replayProtection,
        nodeLifecycleManager,
        sessionLifecycleManager,
        gatewayGuard
    });
}
