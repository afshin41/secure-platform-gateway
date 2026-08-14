import http from "node:http";

import { config } from "./config/config.js";
import { createHealthHandler } from "./http/health.js";
import { SessionManager } from "./sessions/session-manager.js";
import { SignalingService } from "./signaling/signaling-service.js";
import { PlatformWebSocketServer } from "./websocket/websocket-server.js";
import {
    createSecurityIntegration
} from "./security/security-integration.js";

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

const server = http.createServer(
    (request, response) => {
        if (
            request.method === "GET" &&
            request.url === "/health"
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
            request.url === "/"
        ) {
            const body = JSON.stringify({
                service: config.serverName,
                version: config.serverVersion,
                status: "online"
            });

            response.writeHead(200, {
                "Content-Type":
                    "application/json; charset=utf-8",
                "Content-Length":
                    Buffer.byteLength(body)
            });

            response.end(body);
            return;
        }

        response.writeHead(404, {
            "Content-Type":
                "application/json; charset=utf-8"
        });

        response.end(
            JSON.stringify({
                error: "not_found"
            })
        );
    }
);

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

const shutdown = signal => {
    console.log(`Received ${signal}`);

    security.replayProtection.clear();
    security.rateLimiter.clear();
    security.nodeLifecycleManager.revokeAll();
    security.sessionLifecycleManager
        .removeNode("__shutdown__");

    websocketServer.wss.close(() => {
        server.close(() => {
            process.exit(0);
        });
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
