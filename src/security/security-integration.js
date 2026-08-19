import { SecurityRuntimePersistence } from "./security-runtime-persistence.js";
import { SecurityAuditPersistence } from "./security-audit-persistence.js";
import { SecurityManagerFactory } from "./security-manager-factory.js";
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
import { SecurityConnectionGuard } from "./security-connection-guard.js";
import { SecurityRequestGuard } from "./security-request-guard.js";
import { SecuritySessionGuard } from "./security-session-guard.js";
import { SecuritySignalingGuard } from "./security-signaling-guard.js";

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
        throw new Error("invalid_session_manager");
    }

    const securityManager =
        SecurityManagerFactory.create(config);

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
                config.securityRateWindowMs ?? 60 * 1000,
            securityRateMaxRequests:
                config.securityRateMaxRequests ?? 100
        });

    const inputValidator =
        new SecurityInputValidator(config);

    const replayProtection =
        new SecurityReplayProtection({
            ...config,
            securityReplayTtlMs:
                config.securityReplayTtlMs ?? 5 * 60 * 1000,
            securityReplayMaxEntries:
                config.securityReplayMaxEntries ?? 100000
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

    const connectionGuard =
        new SecurityConnectionGuard(
            config,
            policyManager,
            rateLimiter,
            auditManager
        );

    const requestGuard =
        new SecurityRequestGuard(
            config,
            inputValidator,
            policyManager,
            rateLimiter
        );

    const sessionGuard =
        new SecuritySessionGuard(
            config,
            policyManager,
            authorizationManager,
            auditManager
        );

    const signalingGuard =
        new SecuritySignalingGuard(
            config,
            policyManager,
            authorizationManager,
            auditManager
        );

    let runtimePersistence = null;

    return {
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
        gatewayGuard,
        connectionGuard,
        requestGuard,
        sessionGuard,
        signalingGuard,
        runtimePersistence,

        async initializePersistence(
            persistenceManager
        ) {
            const persistence =
                new SecurityRuntimePersistence(
                    persistenceManager
                );

            await persistence.initialize();
            await persistence.restore(
                securityManager
            );

            runtimePersistence = persistence;

            return true;
        },

        async persistSecurityState() {
            if (!runtimePersistence) {
                return false;
            }

            await runtimePersistence.save(
                securityManager
            );

            return true;
        }
    };
}
