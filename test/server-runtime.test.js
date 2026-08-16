import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import WebSocket from "ws";

const waitForOutput = (
    child,
    text,
    timeoutMs = 5000
) =>
    new Promise((resolve, reject) => {
        let output = "";

        const timer = setTimeout(() => {
            reject(
                new Error(
                    `timeout_waiting_for:${text}\n${output}`
                )
            );
        }, timeoutMs);

        const onData = chunk => {
            output += chunk.toString();

            if (output.includes(text)) {
                clearTimeout(timer);
                child.stdout.off("data", onData);
                resolve(output);
            }
        };

        child.stdout.on("data", onData);

        child.once("error", error => {
            clearTimeout(timer);
            reject(error);
        });
    });

test(
    "gateway starts and shuts down cleanly",
    async () => {
        const child = spawn(
            process.execPath,
            ["src/server.js"],
            {
                cwd: process.cwd(),
                env: {
                    ...process.env,
                    NODE_ENV: "production",
                    HOST: "127.0.0.1",
                    PORT: "10003",
                    GATEWAY_ENROLLMENT_TOKEN:
                        "test-production-token-0123456789"
                },
                stdio: [
                    "ignore",
                    "pipe",
                    "pipe"
                ]
            }
        );

        try {
            const output =
                await waitForOutput(
                    child,
                    "WebSocket endpoint: /"
                );

            assert.match(
                output,
                /Secure Platform Gateway 1\.0\.0/
            );

            const healthResponse =
                await fetch(
                    "http://127.0.0.1:10003/health"
                );

            assert.equal(
                healthResponse.status,
                200
            );

            const health =
                await healthResponse.json();

            assert.equal(
                health.service,
                "Secure Platform Gateway"
            );

            assert.equal(
                health.version,
                "1.0.0"
            );

            assert.equal(
                health.status,
                "healthy"
            );

            assert.equal(
                typeof health.nodes,
                "number"
            );

            assert.equal(
                typeof health.sessions,
                "number"
            );

            const rootResponse =
                await fetch(
                    "http://127.0.0.1:10003/"
                );

            assert.equal(
                rootResponse.status,
                200
            );

            const root =
                await rootResponse.json();

            assert.equal(
                root.service,
                "Secure Platform Gateway"
            );

            assert.equal(
                root.version,
                "1.0.0"
            );

            assert.equal(
                root.status,
                "online"
            );

            const notFoundResponse =
                await fetch(
                    "http://127.0.0.1:10003/not-found"
                );

            assert.equal(
                notFoundResponse.status,
                404
            );

            const notFound =
                await notFoundResponse.json();

            assert.equal(
                notFound.error,
                "not_found"
            );

            const socket =
                new WebSocket(
                    "ws://127.0.0.1:10003/"
                );

            await new Promise(
                (resolve, reject) => {
                    socket.once(
                        "open",
                        resolve
                    );

                    socket.once(
                        "error",
                        reject
                    );
                }
            );

            assert.equal(
                socket.readyState,
                WebSocket.OPEN
            );

            const protocolError =
                new Promise(
                    (resolve, reject) => {
                        const timer =
                            setTimeout(
                                () =>
                                    reject(
                                        new Error(
                                            "timeout_waiting_for_protocol_error"
                                        )
                                    ),
                                3000
                            );

                        socket.once(
                            "message",
                            data => {
                                clearTimeout(
                                    timer
                                );
                                resolve(
                                    JSON.parse(
                                        data.toString()
                                    )
                                );
                            }
                        );

                        socket.once(
                            "error",
                            reject
                        );
                    }
                );

            socket.send(
                "{invalid-json"
            );

            const errorResponse =
                await protocolError;

            assert.equal(
                errorResponse.version,
                1
            );

            assert.equal(
                errorResponse.type,
                "error"
            );

            assert.equal(
                errorResponse.request_id,
                null
            );

            assert.equal(
                errorResponse.payload.code,
                "invalid_protocol_message"
            );

            assert.equal(
                errorResponse.payload.message,
                "Invalid protocol message"
            );

            assert.equal(
                socket.readyState,
                WebSocket.OPEN
            );

            const unknownTypeError =
                new Promise(
                    (resolve, reject) => {
                        const timer =
                            setTimeout(
                                () =>
                                    reject(
                                        new Error(
                                            "timeout_waiting_for_unknown_type_error"
                                        )
                                    ),
                                3000
                            );

                        socket.once(
                            "message",
                            data => {
                                clearTimeout(
                                    timer
                                );
                                resolve(
                                    JSON.parse(
                                        data.toString()
                                    )
                                );
                            }
                        );

                        socket.once(
                            "error",
                            reject
                        );
                    }
                );

            socket.send(
                JSON.stringify({
                    version: 1,
                    request_id: "unknown-type-test",
                    type: "unknown.message",
                    payload: {}
                })
            );

            const unknownTypeResponse =
                await unknownTypeError;

            assert.equal(
                unknownTypeResponse.version,
                1
            );

            assert.equal(
                unknownTypeResponse.type,
                "error"
            );

            assert.equal(
                unknownTypeResponse.request_id,
                "unknown-type-test"
            );

            assert.equal(
                socket.readyState,
                WebSocket.OPEN
            );

            const replayRequest =
                JSON.stringify({
                    version: 1,
                    request_id: "replay-test-001",
                    type: "unknown.message",
                    payload: {}
                });

            const firstResponse =
                new Promise(
                    (resolve, reject) => {
                        const timer =
                            setTimeout(
                                () =>
                                    reject(
                                        new Error(
                                            "timeout_waiting_for_first_response"
                                        )
                                    ),
                                3000
                            );

                        socket.once(
                            "message",
                            data => {
                                clearTimeout(
                                    timer
                                );
                                resolve(
                                    JSON.parse(
                                        data.toString()
                                    )
                                );
                            }
                        );

                        socket.once(
                            "error",
                            reject
                        );
                    }
                );

            socket.send(replayRequest);

            const first =
                await firstResponse;

            assert.equal(
                first.type,
                "error"
            );

            assert.equal(
                first.request_id,
                "replay-test-001"
            );

            const replayResponse =
                new Promise(
                    (resolve, reject) => {
                        const timer =
                            setTimeout(
                                () =>
                                    reject(
                                        new Error(
                                            "timeout_waiting_for_replay_response"
                                        )
                                    ),
                                3000
                            );

                        socket.once(
                            "message",
                            data => {
                                clearTimeout(
                                    timer
                                );
                                resolve(
                                    JSON.parse(
                                        data.toString()
                                    )
                                );
                            }
                        );

                        socket.once(
                            "error",
                            reject
                        );
                    }
                );

            socket.send(replayRequest);

            const replay =
                await replayResponse;

            assert.equal(
                replay.version,
                1
            );

            assert.equal(
                replay.type,
                "error"
            );

            assert.equal(
                replay.request_id,
                "replay-test-001"
            );

            assert.equal(
                replay.payload.code,
                "replayed_request"
            );

            assert.equal(
                socket.readyState,
                WebSocket.OPEN
            );

            socket.close();

            await new Promise(
                resolve =>
                    socket.once(
                        "close",
                        resolve
                    )
            );

            child.kill("SIGTERM");

            const exitCode =
                await new Promise(resolve => {
                    child.once(
                        "exit",
                        code => resolve(code)
                    );
                });

            assert.equal(exitCode, 0);
        } finally {
            if (!child.killed) {
                child.kill("SIGKILL");
            }
        }
    }
);
