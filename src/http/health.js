import { sendJson } from "./response.js";

export function createHealthHandler(
    config,
    sessionManager,
    getNodeCount
) {
    return (_request, response) => {
        sendJson(
            response,
            200,
            {
                service: config.serverName,
                version: config.serverVersion,
                status: "healthy",
                nodes: getNodeCount(),
                sessions: sessionManager.count()
            }
        );
    };
}
