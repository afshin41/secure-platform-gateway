import { createHealthHandler } from "./health.js";

export function createHttpRouter(
    config,
    sessionManager,
    getNodeCount,
    getSessionCount = null,
    getSecurityHealth = null
) {
    const healthHandler =
        createHealthHandler(
            config,
            sessionManager,
            getNodeCount,
            getSessionCount,
            getSecurityHealth
        );

    return (req, res) => {
        const url =
            new URL(
                req.url,
                `http://${req.headers.host || "localhost"}`
            );

        if (
            req.method === "GET" &&
            url.pathname === "/health"
        ) {
            const health =
                healthHandler();

            res.writeHead(
                200,
                {
                    "Content-Type":
                        "application/json; charset=utf-8",
                    "Cache-Control":
                        "no-store"
                }
            );

            res.end(
                JSON.stringify(health)
            );

            return;
        }

        if (
            req.method === "GET" &&
            url.pathname === "/"
        ) {
            res.writeHead(
                200,
                {
                    "Content-Type":
                        "application/json; charset=utf-8"
                }
            );

            res.end(
                JSON.stringify({
                    service:
                        config.serverName,
                    version:
                        config.serverVersion,
                    status: "online"
                })
            );

            return;
        }

        res.writeHead(
            404,
            {
                "Content-Type":
                    "application/json; charset=utf-8"
            }
        );

        res.end(
            JSON.stringify({
                error: "not_found"
            })
        );
    };
}
