import http from "node:http";

import { config } from "./config/config.js";
import { validateConfig } from "./config/config-validator.js";
import { createHealthHandler } from "./http/health.js";
import { SessionManager } from "./sessions/session-manager.js";
import { SignalingService } from "./signaling/signaling-service.js";
import { PlatformWebSocketServer } from "./websocket/websocket-server.js";
import {
    createSecurityIntegration
} from "./security/security-integration.js";

validateConfig(config);

const sessionManager =
    new SessionManager(config);

const security =
    createSecurityIntegration(
        config,
        sessionManager
    );

const signalingService =
    new SignalingService(
        config,
        sessionManager
    );

let websocketServer;

const sendJson = (
    response,
    statusCode,
    payload,
    extraHeaders = {}
) => {
    const body = JSON.stringify(payload);

    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy": "default-src 'none'",
        ...extraHeaders
    });

    response.end(body);
};

const server = http.createServer(
    (request, response) => {
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
            const handler =
                createHealthHandler(
                    config,
                    sessionManager,
                    () =>
                        websocketServer
                            ?.getNodeCount() ?? 0
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
    }
);

server.requestTimeout =
    config.httpRequestTimeoutMs ?? 30000;

server.headersTimeout =
    config.httpHeadersTimeoutMs ?? 10000;

server.keepAliveTimeout =
    config.httpKeepAliveTimeoutMs ?? 5000;

websocketServer =
    new PlatformWebSocketServer(
        server,
        config,
        sessionManager,
        signalingService,
        security
    );

server.listen(
    config.port,
    config.host,
    () => {
        console.log(
            `${config.serverName} ${config.serverVersion}`
        );

        console.log(
            `Listening on ${config.host}:${config.port}`
        );

        console.log(
            "HTTP endpoint: /health"
        );

        console.log(
            "WebSocket endpoint: /"
        );
    }
);

let shuttingDown = false;

const shutdown = signal => {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log(`Received ${signal}`);

    security.replayProtection.clear();
    security.rateLimiter.clear();
    security.nodeLifecycleManager.revokeAll();
    security.sessionLifecycleManager
        .removeNode("__shutdown__");

    websocketServer.close();

    const shutdownTimeout = setTimeout(
        () => process.exit(1),
        config.shutdownTimeoutMs ?? 10000
    );

    server.close(() => {
        clearTimeout(shutdownTimeout);
        process.exit(0);
    });
};

process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);
