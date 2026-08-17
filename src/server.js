import http from "node:http";

import { config } from "./config/config.js";
import { validateConfig } from "./config/config-validator.js";
import { createHttpRouter } from "./http/http-router.js";
import { SessionManager } from "./sessions/session-manager.js";
import { SignalingService } from "./signaling/signaling-service.js";
import { PlatformWebSocketServer } from "./websocket/websocket-server.js";
import {
    createSecurityIntegration
} from "./security/security-integration.js";
import { SecurityLifecycleManager } from "./security/security-lifecycle-manager.js";
import { SecurityHealthManager } from "./security/security-health-manager.js";

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

const securityLifecycle =
    new SecurityLifecycleManager(
        config,
        security,
        sessionManager,
        signalingService
    );

securityLifecycle.start();

const securityHealthManager =
    new SecurityHealthManager(
        config,
        security
    );

let websocketServer;

const httpRouter =
    createHttpRouter(
        config,
        sessionManager,
        () =>
            websocketServer
                ?.getNodeCount() ?? 0,
        () =>
            sessionManager.count(),
        () =>
            securityHealthManager.getStatus()
    );

const server =
    http.createServer(httpRouter);

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

server.on(
    "error",
    error => {
        console.error(
            `Gateway server error: ${error?.code || "unknown_error"}`
        );

        if (!server.listening) {
            process.exitCode = 1;
        }
    }
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

        console.log("HTTP endpoint: /health");
        console.log("WebSocket endpoint: /");
    }
);

let shuttingDown = false;

const shutdown = signal => {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log(`Received ${signal}`);

    securityLifecycle.shutdown();

    websocketServer.close();

    const shutdownTimeout =
        setTimeout(
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
