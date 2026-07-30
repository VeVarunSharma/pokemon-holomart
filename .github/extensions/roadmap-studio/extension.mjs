import { createServer } from "node:http";
import { CanvasError, createCanvas, joinSession } from "@github/copilot-sdk/extension";
import {
  RoadmapError,
  draftHandoff,
  focusInitiative,
  loadRoadmapFile,
  prepareRoadmapOpen,
  projectWorkspaceFromExtension,
  roadmapMetadata,
  resolveRenderFocus,
} from "./model.mjs";
import { renderRoadmap, renderShell } from "./renderer.mjs";

const servers = new Map();
const workspacePath = projectWorkspaceFromExtension(import.meta.url);

function canvasError(error) {
  if (error instanceof CanvasError) return error;
  if (error instanceof RoadmapError) return new CanvasError(error.code, error.message);
  return new CanvasError("roadmap_unavailable", error instanceof Error ? error.message : "Roadmap operation failed.");
}

function json(res, status, value) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(JSON.stringify(value));
}

async function body(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw new RoadmapError("request_too_large", "Request body exceeds 64 KB.");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RoadmapError("request_json_invalid", "Request body must be valid JSON.");
  }
}

async function reloadEntry(entry) {
  const loaded = await loadRoadmapFile(workspacePath, entry.roadmapPath);
  entry.roadmap = loaded.roadmap;
  entry.durablePath = loaded.durablePath;
  if (entry.focus && !loaded.roadmap.initiatives.some((item) => item.id === entry.focus)) entry.focus = null;
  return roadmapMetadata(entry.roadmap, entry.durablePath, entry.focus);
}

async function startServer(entry) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      if (req.method === "GET" && url.pathname === "/") {
        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self';",
          "x-content-type-options": "nosniff",
        });
        return res.end(renderShell(entry.roadmap, entry.durablePath, entry.focus));
      }
      if (req.method === "GET" && url.pathname === "/api/render") {
        const horizon = url.searchParams.get("horizon") || "all";
        const status = url.searchParams.get("status") || "all";
        const focus = resolveRenderFocus(url.searchParams, entry.focus);
        if (focus) focusInitiative(entry.roadmap, focus);
        entry.focus = focus;
        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        });
        return res.end(renderRoadmap(entry.roadmap, { horizon, status, focus }));
      }
      if (req.method === "POST" && url.pathname === "/api/refresh") {
        return json(res, 200, await reloadEntry(entry));
      }
      if (req.method === "POST" && url.pathname === "/api/focus") {
        const input = await body(req);
        const initiative = focusInitiative(entry.roadmap, input.initiativeId);
        entry.focus = initiative.id;
        return json(res, 200, { initiativeId: initiative.id, title: initiative.title });
      }
      return json(res, 404, { error: "Endpoint not found." });
    } catch (error) {
      const known = error instanceof RoadmapError;
      return json(res, known ? 400 : 500, {
        code: known ? error.code : "internal_error",
        error: error instanceof Error ? error.message : "Request failed.",
      });
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return { server, url: `http://127.0.0.1:${port}/` };
}

function getEntry(instanceId) {
  const entry = servers.get(instanceId);
  if (!entry) throw new CanvasError("canvas_instance_unavailable", `Roadmap Studio instance is not open: ${instanceId}`);
  return entry;
}

const canvas = createCanvas({
  id: "roadmap-studio",
  displayName: "Roadmap Studio",
  description: "Explore a committed roadmap and draft evidence-grounded engineering handoffs.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      roadmapPath: {
        type: "string",
        minLength: 1,
        description: "Workspace-contained JSON roadmap path; defaults to product/roadmap.json.",
      },
      initiativeFocus: {
        type: "string",
        minLength: 1,
        description: "Optional initiative id or unique id fragment to focus when opening.",
      },
    },
  },
  actions: [
    {
      name: "refresh",
      description: "Reload and validate the committed roadmap artifact.",
      inputSchema: { type: "object", additionalProperties: false },
      handler: async (ctx) => {
        try {
          return await reloadEntry(getEntry(ctx.instanceId));
        } catch (error) {
          throw canvasError(error);
        }
      },
    },
    {
      name: "focus_initiative",
      description: "Focus a validated roadmap initiative and return its committed detail.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["initiativeId"],
        properties: { initiativeId: { type: "string", minLength: 1 } },
      },
      handler: async (ctx) => {
        try {
          const entry = getEntry(ctx.instanceId);
          const initiative = focusInitiative(entry.roadmap, ctx.input.initiativeId);
          entry.focus = initiative.id;
          return initiative;
        } catch (error) {
          throw canvasError(error);
        }
      },
    },
    {
      name: "draft_handoff",
      description: "Draft a read-only Product-to-Engineering Markdown handoff from committed roadmap data.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["initiativeId"],
        properties: { initiativeId: { type: "string", minLength: 1 } },
      },
      handler: async (ctx) => {
        try {
          const entry = getEntry(ctx.instanceId);
          return {
            initiativeId: ctx.input.initiativeId,
            markdown: draftHandoff(entry.roadmap, ctx.input.initiativeId),
            source: entry.durablePath,
            readOnly: true,
          };
        } catch (error) {
          throw canvasError(error);
        }
      },
    },
  ],
  open: async (ctx) => {
    try {
      const loaded = await prepareRoadmapOpen(workspacePath, ctx.input);
      const { roadmapPath, focus } = loaded;
      let entry = servers.get(ctx.instanceId);
      if (entry) {
        entry.roadmapPath = roadmapPath;
        entry.roadmap = loaded.roadmap;
        entry.durablePath = loaded.durablePath;
        entry.focus = focus;
      } else {
        entry = {
          roadmapPath,
          roadmap: loaded.roadmap,
          durablePath: loaded.durablePath,
          focus,
        };
        Object.assign(entry, await startServer(entry));
        servers.set(ctx.instanceId, entry);
      }
      return {
        title: "Roadmap Studio",
        status: `${entry.roadmap.initiatives.length} initiatives · ${entry.durablePath}`,
        url: entry.url,
      };
    } catch (error) {
      throw canvasError(error);
    }
  },
  onClose: async (ctx) => {
    const entry = servers.get(ctx.instanceId);
    if (!entry) return;
    servers.delete(ctx.instanceId);
    await new Promise((resolve) => entry.server.close(resolve));
  },
});

await joinSession({ canvases: [canvas] });
