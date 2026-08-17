export function createHealthHandler(
    config,
    sessionManager,
    getNodeCount,
    getSessionCount = null,
    getSecurityHealth = null
) {
    return () => {
        const result = {
            status: "healthy",
            service:
                config.serverName,
            version:
                config.serverVersion,
            timestamp:
                Date.now(),
            nodes:
                typeof getNodeCount === "function"
                    ? getNodeCount()
                    : 0,
            sessions:
                typeof getSessionCount === "function"
                    ? getSessionCount()
                    : (
                        sessionManager &&
                        typeof sessionManager.count === "function"
                            ? sessionManager.count()
                            : 0
                    )
        };

        if (typeof getSecurityHealth === "function") {
            result.security =
                getSecurityHealth();
        }

        return result;
    };
}
