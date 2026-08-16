import { sendJson } from "./response.js";
import { createHealthHandler } from "./health.js";

export function createHttpRouter(
    config,
    sessionManager,
    getNodeCount
) {
    return (request, response) => {
        let pathname;

        try {
            pathname = new URL(
                request.url || "/",
                "http://localhost"
            ).pathname;
        } catch {
            sendJson(
                response,
                400,
                {
                    error: "invalid_request_target"
                }
            );
            return;
        }

        if (
            request.method === "GET" &&
            pathname === "/health"
        ) {
            const handler = createHealthHandler(
                config,
                sessionManager,
                getNodeCount
            );

            handler(request, response);
            return;
        }

        if (
            request.method === "GET" &&
            pathname === "/"
        ) {
            sendJson(
                response,
                200,
                {
                    service: config.serverName,
                    version: config.serverVersion,
                    status: "online"
                }
            );
            return;
        }

        if (
            pathname === "/" ||
            pathname === "/health"
        ) {
            sendJson(
                response,
                405,
                {
                    error: "method_not_allowed"
                },
                {
                    Allow: "GET"
                }
            );
            return;
        }

        sendJson(
            response,
            404,
            {
                error: "not_found"
            }
        );
    };
}
