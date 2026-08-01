import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import {
    CanvasError,
    createCanvas,
    joinSession,
} from "@github/copilot-sdk/extension";
import { renderRoadmapHtml } from "./renderer.mjs";
import { RoadmapStore, RoadmapStoreError } from "./roadmap-store.mjs";

const roadmapPath = fileURLToPath(new URL("./roadmap.json", import.meta.url));
const store = new RoadmapStore(roadmapPath);
const servers = new Map();
let extensionSession;

function sendJson(response, statusCode, payload) {
    response.writeHead(statusCode, {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
    });
    response.end(JSON.stringify(payload));
}

function sendHtml(response, html) {
    response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Security-Policy":
            "default-src 'none'; connect-src 'self'; img-src data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'",
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
    });
    response.end(html);
}

async function readJsonBody(request) {
    const chunks = [];
    let size = 0;

    for await (const chunk of request) {
        size += chunk.length;
        if (size > 1024 * 1024) {
            throw new RoadmapStoreError(
                "request_too_large",
                "The request body must be smaller than 1 MB.",
            );
        }
        chunks.push(chunk);
    }

    if (chunks.length === 0) {
        throw new RoadmapStoreError(
            "request_body_required",
            "A JSON request body is required.",
        );
    }

    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
        throw new RoadmapStoreError(
            "request_invalid_json",
            "The request body must contain valid JSON.",
        );
    }
}

function writeRoadmapEvent(response, roadmap) {
    response.write(`event: roadmap\ndata: ${JSON.stringify(roadmap)}\n\n`);
}

function broadcastRoadmap(roadmap) {
    for (const entry of servers.values()) {
        for (const client of entry.clients) {
            writeRoadmapEvent(client, roadmap);
        }
    }
}

function errorStatus(error) {
    if (!(error instanceof RoadmapStoreError)) {
        return 500;
    }
    if (error.code.endsWith("_not_found")) {
        return 404;
    }
    if (error.code.endsWith("_exists")) {
        return 409;
    }
    return 400;
}

async function reportServerError(error) {
    if (extensionSession && !(error instanceof RoadmapStoreError)) {
        await extensionSession.log(`Roadmap canvas error: ${error.message}`, {
            level: "error",
        });
    }
}

async function handleRequest(request, response, clients, viewConfig) {
    const requestUrl = new URL(
        request.url ?? "/",
        "http://127.0.0.1",
    );
    const method = request.method ?? "GET";

    if (method === "GET" && requestUrl.pathname === "/") {
        sendHtml(response, renderRoadmapHtml(viewConfig));
        return;
    }

    if (method === "GET" && requestUrl.pathname === "/api/roadmap") {
        sendJson(response, 200, await store.read());
        return;
    }

    if (method === "GET" && requestUrl.pathname === "/events") {
        response.writeHead(200, {
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "Content-Type": "text/event-stream; charset=utf-8",
            "X-Accel-Buffering": "no",
            "X-Content-Type-Options": "nosniff",
        });
        response.write("retry: 2000\n\n");
        clients.add(response);

        const removeClient = () => clients.delete(response);
        request.on("close", removeClient);
        response.on("close", removeClient);
        return;
    }

    if (method === "POST" && requestUrl.pathname === "/api/items") {
        const result = await store.addItem(await readJsonBody(request));
        broadcastRoadmap(result.roadmap);
        sendJson(response, 201, result);
        return;
    }

    const itemMatch = requestUrl.pathname.match(/^\/api\/items\/([^/]+)$/);
    if (itemMatch && method === "PATCH") {
        const result = await store.updateItem(
            decodeURIComponent(itemMatch[1]),
            await readJsonBody(request),
        );
        broadcastRoadmap(result.roadmap);
        sendJson(response, 200, result);
        return;
    }

    if (itemMatch && method === "DELETE") {
        const result = await store.removeItem(
            decodeURIComponent(itemMatch[1]),
        );
        broadcastRoadmap(result.roadmap);
        sendJson(response, 200, result);
        return;
    }

    sendJson(response, 404, {
        code: "route_not_found",
        error: "The requested roadmap endpoint does not exist.",
    });
}

async function startServer(instanceId, focusItemId) {
    const clients = new Set();
    const viewConfig = { focusItemId, instanceId };
    const server = createServer((request, response) => {
        handleRequest(request, response, clients, viewConfig).catch(
            async (error) => {
                await reportServerError(error);
                if (!response.headersSent) {
                    sendJson(response, errorStatus(error), {
                        code:
                            error instanceof RoadmapStoreError
                                ? error.code
                                : "roadmap_internal_error",
                        error:
                            error instanceof Error
                                ? error.message
                                : "The roadmap request failed.",
                    });
                } else {
                    response.end();
                }
            },
        );
    });

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
            server.off("error", reject);
            resolve();
        });
    });

    const address = server.address();
    if (!address || typeof address === "string") {
        await new Promise((resolve) => server.close(resolve));
        throw new Error("The roadmap canvas server did not receive a port.");
    }

    return {
        clients,
        server,
        url: `http://127.0.0.1:${address.port}/`,
    };
}

async function runCanvasOperation(operation) {
    try {
        return await operation();
    } catch (error) {
        if (error instanceof RoadmapStoreError) {
            throw new CanvasError(error.code, error.message);
        }
        throw error;
    }
}

const itemProperties = {
    category: {
        type: "string",
        maxLength: 80,
    },
    description: {
        type: "string",
        maxLength: 2000,
    },
    owner: {
        type: "string",
        maxLength: 120,
    },
    progress: {
        type: "integer",
        minimum: 0,
        maximum: 100,
    },
    quarter: {
        type: "string",
        minLength: 1,
        maxLength: 80,
    },
    status: {
        type: "string",
        enum: ["planned", "in-progress", "at-risk", "done"],
    },
    targetDate: {
        type: "string",
        pattern: "^(|\\d{4}-\\d{2}-\\d{2})$",
    },
    title: {
        type: "string",
        minLength: 1,
        maxLength: 160,
    },
};

const roadmapCanvas = createCanvas({
    id: "roadmap-view",
    displayName: "Roadmap",
    description:
        "View and edit a repository-backed product roadmap on a quarterly timeline.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            focusItemId: {
                type: "string",
                minLength: 1,
                maxLength: 80,
                description: "Optional roadmap item to highlight after opening.",
            },
        },
    },
    actions: [
        {
            name: "get_roadmap",
            description:
                "Read the roadmap metadata, quarters, and all roadmap items.",
            handler: () => runCanvasOperation(() => store.read()),
        },
        {
            name: "add_roadmap_item",
            description: "Add an item to a quarter in the roadmap.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    id: {
                        type: "string",
                        pattern: "^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$",
                    },
                    ...itemProperties,
                },
                required: ["title", "quarter"],
            },
            handler: (ctx) =>
                runCanvasOperation(async () => {
                    const result = await store.addItem(ctx.input);
                    broadcastRoadmap(result.roadmap);
                    return result;
                }),
        },
        {
            name: "update_roadmap_item",
            description: "Update fields on an existing roadmap item.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    id: {
                        type: "string",
                        minLength: 1,
                        maxLength: 80,
                    },
                    changes: {
                        type: "object",
                        additionalProperties: false,
                        minProperties: 1,
                        properties: itemProperties,
                    },
                },
                required: ["id", "changes"],
            },
            handler: (ctx) =>
                runCanvasOperation(async () => {
                    const result = await store.updateItem(
                        ctx.input.id,
                        ctx.input.changes,
                    );
                    broadcastRoadmap(result.roadmap);
                    return result;
                }),
        },
        {
            name: "remove_roadmap_item",
            description: "Remove an existing roadmap item by ID.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    id: {
                        type: "string",
                        minLength: 1,
                        maxLength: 80,
                    },
                },
                required: ["id"],
            },
            handler: (ctx) =>
                runCanvasOperation(async () => {
                    const result = await store.removeItem(ctx.input.id);
                    broadcastRoadmap(result.roadmap);
                    return result;
                }),
        },
    ],
    open: async (ctx) => {
        const roadmap = await runCanvasOperation(() => store.initialize());
        let entry = servers.get(ctx.instanceId);

        if (!entry) {
            entry = await startServer(
                ctx.instanceId,
                ctx.input?.focusItemId,
            );
            servers.set(ctx.instanceId, entry);
        }

        return {
            status: `${roadmap.items.length} roadmap items`,
            title: roadmap.title,
            url: entry.url,
        };
    },
    onClose: async (ctx) => {
        const entry = servers.get(ctx.instanceId);
        if (!entry) {
            return;
        }

        servers.delete(ctx.instanceId);
        for (const client of entry.clients) {
            client.end();
        }
        await new Promise((resolve, reject) => {
            entry.server.close((error) =>
                error ? reject(error) : resolve(),
            );
        });
    },
});

extensionSession = await joinSession({
    canvases: [roadmapCanvas],
});
