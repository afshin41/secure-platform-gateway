export function sendJson(
    response,
    statusCode,
    payload,
    extraHeaders = {}
) {
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
}
