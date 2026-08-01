import { createServer } from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
    CanvasError,
    createCanvas,
    joinSession,
} from "@github/copilot-sdk/extension";
import {
    addRequirement,
    exportSpec,
    loadSpec,
    mergeSpec,
    resolveOpenInput,
    saveSpec,
    SpecValidationError,
    specToMarkdown,
} from "./model.mjs";
import { APP_JS, renderHtml, STYLES } from "./renderer.mjs";

const extensionDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(extensionDirectory, "..", "..", "..");
const storageDirectory = join(projectRoot, ".github", "product-design-specs");
const servers = new Map();
let session;

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function applySecurityHeaders(res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Security-Policy", [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "connect-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "frame-ancestors *",
    ].join("; "));
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Content-Type-Options", "nosniff");
}

function sendJson(res, status, value) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(value));
}

function sendText(res, status, contentType, value, extraHeaders = {}) {
    res.writeHead(status, { "Content-Type": contentType, ...extraHeaders });
    res.end(value);
}

async function readJson(req) {
    const maximumBytes = 1024 * 1024;
    const chunks = [];
    let size = 0;

    for await (const chunk of req) {
        size += chunk.length;
        if (size > maximumBytes) {
            throw new HttpError(413, "The specification exceeds the 1 MB limit.");
        }
        chunks.push(chunk);
    }

    if (chunks.length === 0) {
        throw new HttpError(400, "A JSON request body is required.");
    }

    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
        throw new HttpError(400, "The request body is not valid JSON.");
    }
}

function publishDocument(documentId, event) {
    for (const entry of servers.values()) {
        if (entry.documentId === documentId) {
            entry.publish(event);
        }
    }
}

function reportServerError(error) {
    session?.log(`Product design canvas error: ${error.message}`, {
        level: "error",
        ephemeral: true,
    });
}

async function handleRequest(entry, req, res) {
    applySecurityHeaders(res);
    const url = new URL(req.url ?? "/", "http://127.0.0.1");

    if (req.method === "GET" && url.pathname === "/") {
        sendText(res, 200, "text/html; charset=utf-8", renderHtml());
        return;
    }

    if (req.method === "GET" && url.pathname === "/styles.css") {
        sendText(res, 200, "text/css; charset=utf-8", STYLES);
        return;
    }

    if (req.method === "GET" && url.pathname === "/app.js") {
        sendText(res, 200, "text/javascript; charset=utf-8", APP_JS);
        return;
    }

    if (req.method === "GET" && url.pathname === "/api/spec") {
        const spec = await loadSpec(storageDirectory, { documentId: entry.documentId });
        sendJson(res, 200, spec);
        return;
    }

    if (req.method === "PUT" && url.pathname === "/api/spec") {
        const input = await readJson(req);
        const spec = await saveSpec(storageDirectory, entry.documentId, input);
        publishDocument(entry.documentId, { updatedAt: spec.meta.updatedAt });
        sendJson(res, 200, spec);
        return;
    }

    if (req.method === "GET" && url.pathname === "/api/export") {
        const spec = await loadSpec(storageDirectory, { documentId: entry.documentId });
        sendText(
            res,
            200,
            "text/markdown; charset=utf-8",
            specToMarkdown(spec),
            { "Content-Disposition": `attachment; filename="${entry.documentId}.md"` },
        );
        return;
    }

    if (req.method === "GET" && url.pathname === "/events") {
        res.writeHead(200, {
            "Content-Type": "text/event-stream; charset=utf-8",
            Connection: "keep-alive",
        });
        res.write(": connected\n\n");
        entry.clients.add(res);
        req.on("close", () => entry.clients.delete(res));
        return;
    }

    throw new HttpError(404, "Canvas route not found.");
}

async function startServer(instanceId, documentId) {
    const clients = new Set();
    const entry = {
        clients,
        documentId,
        instanceId,
        publish(event) {
            const payload = `event: spec-updated\ndata: ${JSON.stringify(event)}\n\n`;
            for (const client of clients) {
                client.write(payload);
            }
        },
    };

    const server = createServer((req, res) => {
        handleRequest(entry, req, res).catch((error) => {
            const status = error instanceof HttpError
                ? error.status
                : error instanceof SpecValidationError
                    ? 400
                    : 500;
            if (status >= 500) {
                reportServerError(error);
            }
            if (!res.headersSent) {
                applySecurityHeaders(res);
                sendJson(res, status, { error: error.message });
            } else {
                res.end();
            }
        });
    });

    await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    return {
        ...entry,
        server,
        url: `http://127.0.0.1:${port}/`,
    };
}

async function closeServer(entry) {
    for (const client of entry.clients) {
        client.end();
    }
    entry.clients.clear();
    await new Promise((resolveClose) => entry.server.close(() => resolveClose()));
}

function entryFor(instanceId) {
    const entry = servers.get(instanceId);
    if (!entry) {
        throw new CanvasError(
            "product_spec_not_open",
            "Open the product design canvas before invoking this action.",
        );
    }
    return entry;
}

function asCanvasError(code, error) {
    if (error instanceof CanvasError) {
        return error;
    }
    return new CanvasError(code, error instanceof Error ? error.message : String(error));
}

const canvas = createCanvas({
    id: "product-design-specs",
    displayName: "Product design specs",
    description: "Create and maintain product briefs, requirements, UX flows, UI states, metrics, and design decisions.",
    inputSchema: {
        type: "object",
        properties: {
            documentId: {
                type: "string",
                pattern: "^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$",
                description: "Stable ID used for the project specification file.",
            },
            title: {
                type: "string",
                minLength: 1,
                maxLength: 160,
                description: "Initial title used only when creating a new specification.",
            },
            template: {
                type: "string",
                enum: ["product", "feature", "ux-review"],
                description: "Starter structure used only when creating a new specification.",
            },
        },
        additionalProperties: false,
    },
    actions: [
        {
            name: "get_spec",
            description: "Read the complete product and design specification shown in this canvas.",
            handler: async (ctx) => {
                try {
                    const entry = entryFor(ctx.instanceId);
                    return await loadSpec(storageDirectory, { documentId: entry.documentId });
                } catch (error) {
                    throw asCanvasError("product_spec_read_failed", error);
                }
            },
        },
        {
            name: "update_spec",
            description: "Apply a partial update to the product brief, requirements, UX, UI, delivery, or metadata.",
            inputSchema: {
                type: "object",
                required: ["patch"],
                properties: {
                    patch: {
                        type: "object",
                        minProperties: 1,
                        properties: {
                            meta: { type: "object" },
                            brief: { type: "object" },
                            requirements: { type: "array" },
                            experience: { type: "object" },
                            ui: { type: "object" },
                            delivery: { type: "object" },
                        },
                        additionalProperties: false,
                    },
                },
                additionalProperties: false,
            },
            handler: async (ctx) => {
                try {
                    const entry = entryFor(ctx.instanceId);
                    const current = await loadSpec(storageDirectory, {
                        documentId: entry.documentId,
                    });
                    const spec = await saveSpec(
                        storageDirectory,
                        entry.documentId,
                        mergeSpec(current, ctx.input.patch),
                    );
                    publishDocument(entry.documentId, { updatedAt: spec.meta.updatedAt });
                    return spec;
                } catch (error) {
                    throw asCanvasError("product_spec_update_failed", error);
                }
            },
        },
        {
            name: "add_requirement",
            description: "Add one prioritized product requirement with acceptance criteria.",
            inputSchema: {
                type: "object",
                required: ["title"],
                properties: {
                    title: { type: "string", minLength: 1, maxLength: 240 },
                    priority: { type: "string", enum: ["Must", "Should", "Could", "Won't"] },
                    status: { type: "string", enum: ["Proposed", "Ready", "In progress", "Done"] },
                    owner: { type: "string", maxLength: 120 },
                    description: { type: "string", maxLength: 4000 },
                    acceptanceCriteria: { type: "string", maxLength: 4000 },
                },
                additionalProperties: false,
            },
            handler: async (ctx) => {
                try {
                    const entry = entryFor(ctx.instanceId);
                    const current = await loadSpec(storageDirectory, {
                        documentId: entry.documentId,
                    });
                    const { spec: next, requirement } = addRequirement(current, ctx.input);
                    const spec = await saveSpec(storageDirectory, entry.documentId, next);
                    publishDocument(entry.documentId, { updatedAt: spec.meta.updatedAt });
                    return { documentId: entry.documentId, requirement, updatedAt: spec.meta.updatedAt };
                } catch (error) {
                    throw asCanvasError("product_requirement_add_failed", error);
                }
            },
        },
        {
            name: "export_markdown",
            description: "Export the current specification to a Markdown file beside its JSON source.",
            handler: async (ctx) => {
                try {
                    const entry = entryFor(ctx.instanceId);
                    const spec = await loadSpec(storageDirectory, {
                        documentId: entry.documentId,
                    });
                    const path = await exportSpec(storageDirectory, spec);
                    return { documentId: entry.documentId, path };
                } catch (error) {
                    throw asCanvasError("product_spec_export_failed", error);
                }
            },
        },
    ],
    open: async (ctx) => {
        try {
            const input = resolveOpenInput(ctx.input);
            const spec = await loadSpec(storageDirectory, input);
            let entry = servers.get(ctx.instanceId);

            if (entry && entry.documentId !== input.documentId) {
                await closeServer(entry);
                servers.delete(ctx.instanceId);
                entry = undefined;
            }

            if (!entry) {
                entry = await startServer(ctx.instanceId, input.documentId);
                servers.set(ctx.instanceId, entry);
            }

            return {
                title: spec.meta.title,
                status: `${spec.meta.status} - ${spec.requirements.length} requirements`,
                url: entry.url,
            };
        } catch (error) {
            throw asCanvasError("product_spec_open_failed", error);
        }
    },
    onClose: async (ctx) => {
        const entry = servers.get(ctx.instanceId);
        if (entry) {
            servers.delete(ctx.instanceId);
            await closeServer(entry);
        }
    },
});

session = await joinSession({
    canvases: [canvas],
});
