export function createHealthHandler(
    config,
    sessionManager,
    getNodeCount
) {
    return (_request, response) => {
        const body = JSON.stringify({
            service: config.serverName,
            version: config.serverVersion,
            status: "healthy",
            nodes: getNodeCount(),
            sessions: sessionManager.count()
        });

        response.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": Buffer.byteLength(body)
        });

        response.end(body);
    };
}
