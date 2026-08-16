import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";

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
