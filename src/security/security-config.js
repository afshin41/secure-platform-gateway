export const securityConfig = Object.freeze({
    replayTtlMs: 5 * 60 * 1000,
    replayMaxEntries: 100000,

    rateWindowMs: 60 * 1000,
    rateMaxRequests: 100,

    maxNodeIdLength: 128,
    maxTokenLength: 512,
    maxSessionIdLength: 128,
    maxSignalTypeLength: 128,

    requireAuthentication: true,
    requireAccessToken: true,
    requireRegisteredNode: true,
    requireSessionAuthorization: true,
    requireSignalingAuthorization: true,
    preventSelfSession: true
});
