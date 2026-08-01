import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DOCUMENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const TEMPLATES = new Set(["product", "feature", "ux-review"]);
const SPEC_STATUSES = new Set(["Draft", "In review", "Approved", "Shipped"]);
const PRIORITIES = new Set(["Must", "Should", "Could", "Won't"]);
const REQUIREMENT_STATUSES = new Set(["Proposed", "Ready", "In progress", "Done"]);
const ACCESSIBILITY_STATUSES = new Set(["Not reviewed", "In progress", "Met", "Exception"]);
const saveQueues = new Map();

export class SpecValidationError extends Error {}

function makeId(prefix) {
    return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function assertObject(value, path) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new SpecValidationError(`${path} must be an object.`);
    }
    return value;
}

function stringValue(value, fallback, path) {
    if (value === undefined) {
        return fallback;
    }
    if (typeof value !== "string") {
        throw new SpecValidationError(`${path} must be a string.`);
    }
    return value;
}

function enumValue(value, fallback, allowed, path) {
    const result = stringValue(value, fallback, path);
    if (!allowed.has(result)) {
        throw new SpecValidationError(`${path} has an unsupported value.`);
    }
    return result;
}

function stringArray(value, fallback, path) {
    if (value === undefined) {
        return [...fallback];
    }
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
        throw new SpecValidationError(`${path} must be an array of strings.`);
    }
    return [...value];
}

function objectArray(value, fallback, path, normalizer) {
    if (value === undefined) {
        return fallback.map((item, index) => normalizer(item, `${path}[${index}]`));
    }
    if (!Array.isArray(value)) {
        throw new SpecValidationError(`${path} must be an array.`);
    }
    return value.map((item, index) => normalizer(assertObject(item, `${path}[${index}]`), `${path}[${index}]`));
}

function rowId(value, prefix, path) {
    const id = stringValue(value, makeId(prefix), `${path}.id`);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(id)) {
        throw new SpecValidationError(`${path}.id is invalid.`);
    }
    return id;
}

function templateTitle(template) {
    if (template === "feature") {
        return "Feature design specification";
    }
    if (template === "ux-review") {
        return "UX review specification";
    }
    return "Product design specification";
}

export function resolveOpenInput(input = {}) {
    const value = assertObject(input ?? {}, "Canvas input");
    const documentId = stringValue(value.documentId, "product-spec", "documentId");
    if (!DOCUMENT_ID_PATTERN.test(documentId)) {
        throw new SpecValidationError(
            "documentId must begin with a letter or number and contain only letters, numbers, dots, underscores, or hyphens.",
        );
    }

    const template = stringValue(value.template, "product", "template");
    if (!TEMPLATES.has(template)) {
        throw new SpecValidationError("template must be product, feature, or ux-review.");
    }

    const title = stringValue(value.title, templateTitle(template), "title").trim();
    if (!title) {
        throw new SpecValidationError("title cannot be empty.");
    }

    return { documentId, template, title };
}

export function createDefaultSpec({ documentId, template = "product", title = templateTitle(template) }) {
    const now = new Date().toISOString();
    return {
        schemaVersion: 1,
        documentId,
        meta: {
            title,
            status: "Draft",
            owner: "",
            reviewers: "",
            template,
            createdAt: now,
            updatedAt: now,
        },
        brief: {
            oneLiner: "",
            problem: "",
            audience: "",
            value: "",
            goals: [],
            nonGoals: [],
            assumptions: [],
        },
        requirements: [],
        experience: {
            jobStory: "",
            principles: [],
            flow: [],
            states: [],
        },
        ui: {
            visualDirection: "",
            responsiveBehavior: "",
            contentGuidance: "",
            screens: [],
            components: [],
        },
        delivery: {
            metrics: [],
            analytics: [],
            accessibility: [
                {
                    id: "a11y-keyboard",
                    label: "Keyboard navigation and visible focus",
                    status: "Not reviewed",
                    notes: "",
                },
                {
                    id: "a11y-contrast",
                    label: "Contrast, non-color cues, and readable text",
                    status: "Not reviewed",
                    notes: "",
                },
                {
                    id: "a11y-semantics",
                    label: "Labels, roles, structure, and announcements",
                    status: "Not reviewed",
                    notes: "",
                },
                {
                    id: "a11y-reflow",
                    label: "Zoom, reflow, touch targets, and responsive use",
                    status: "Not reviewed",
                    notes: "",
                },
                {
                    id: "a11y-motion",
                    label: "Reduced motion and equivalent alternatives",
                    status: "Not reviewed",
                    notes: "",
                },
            ],
            dependencies: [],
            risks: [],
            openQuestions: [],
        },
    };
}

function normalizeRequirement(value, path) {
    return {
        id: rowId(value.id, "req", path),
        title: stringValue(value.title, "", `${path}.title`),
        priority: enumValue(value.priority, "Should", PRIORITIES, `${path}.priority`),
        status: enumValue(value.status, "Proposed", REQUIREMENT_STATUSES, `${path}.status`),
        owner: stringValue(value.owner, "", `${path}.owner`),
        description: stringValue(value.description, "", `${path}.description`),
        acceptanceCriteria: stringValue(value.acceptanceCriteria, "", `${path}.acceptanceCriteria`),
    };
}

function normalizeFlowStep(value, path) {
    return {
        id: rowId(value.id, "flow", path),
        name: stringValue(value.name, "", `${path}.name`),
        actor: stringValue(value.actor, "", `${path}.actor`),
        description: stringValue(value.description, "", `${path}.description`),
    };
}

function normalizeState(value, path) {
    return {
        id: rowId(value.id, "state", path),
        surface: stringValue(value.surface, "", `${path}.surface`),
        state: stringValue(value.state, "", `${path}.state`),
        trigger: stringValue(value.trigger, "", `${path}.trigger`),
        behavior: stringValue(value.behavior, "", `${path}.behavior`),
    };
}

function normalizeScreen(value, path) {
    return {
        id: rowId(value.id, "screen", path),
        name: stringValue(value.name, "", `${path}.name`),
        purpose: stringValue(value.purpose, "", `${path}.purpose`),
        primaryAction: stringValue(value.primaryAction, "", `${path}.primaryAction`),
        notes: stringValue(value.notes, "", `${path}.notes`),
    };
}

function normalizeComponent(value, path) {
    return {
        id: rowId(value.id, "component", path),
        name: stringValue(value.name, "", `${path}.name`),
        behavior: stringValue(value.behavior, "", `${path}.behavior`),
        variants: stringValue(value.variants, "", `${path}.variants`),
    };
}

function normalizeMetric(value, path) {
    return {
        id: rowId(value.id, "metric", path),
        name: stringValue(value.name, "", `${path}.name`),
        target: stringValue(value.target, "", `${path}.target`),
        signal: stringValue(value.signal, "", `${path}.signal`),
    };
}

function normalizeAnalytics(value, path) {
    return {
        id: rowId(value.id, "event", path),
        name: stringValue(value.name, "", `${path}.name`),
        trigger: stringValue(value.trigger, "", `${path}.trigger`),
        properties: stringValue(value.properties, "", `${path}.properties`),
    };
}

function normalizeAccessibility(value, path) {
    return {
        id: rowId(value.id, "a11y", path),
        label: stringValue(value.label, "", `${path}.label`),
        status: enumValue(
            value.status,
            "Not reviewed",
            ACCESSIBILITY_STATUSES,
            `${path}.status`,
        ),
        notes: stringValue(value.notes, "", `${path}.notes`),
    };
}

export function normalizeSpec(value, documentId) {
    const source = assertObject(value, "Specification");
    const defaults = createDefaultSpec({
        documentId,
        template: source.meta?.template ?? "product",
        title: source.meta?.title ?? undefined,
    });
    const meta = assertObject(source.meta ?? defaults.meta, "meta");
    const brief = assertObject(source.brief ?? defaults.brief, "brief");
    const experience = assertObject(source.experience ?? defaults.experience, "experience");
    const ui = assertObject(source.ui ?? defaults.ui, "ui");
    const delivery = assertObject(source.delivery ?? defaults.delivery, "delivery");
    const template = stringValue(meta.template, defaults.meta.template, "meta.template");

    if (!TEMPLATES.has(template)) {
        throw new SpecValidationError("meta.template has an unsupported value.");
    }

    return {
        schemaVersion: 1,
        documentId,
        meta: {
            title: stringValue(meta.title, defaults.meta.title, "meta.title"),
            status: enumValue(meta.status, "Draft", SPEC_STATUSES, "meta.status"),
            owner: stringValue(meta.owner, "", "meta.owner"),
            reviewers: stringValue(meta.reviewers, "", "meta.reviewers"),
            template,
            createdAt: stringValue(meta.createdAt, defaults.meta.createdAt, "meta.createdAt"),
            updatedAt: stringValue(meta.updatedAt, defaults.meta.updatedAt, "meta.updatedAt"),
        },
        brief: {
            oneLiner: stringValue(brief.oneLiner, "", "brief.oneLiner"),
            problem: stringValue(brief.problem, "", "brief.problem"),
            audience: stringValue(brief.audience, "", "brief.audience"),
            value: stringValue(brief.value, "", "brief.value"),
            goals: stringArray(brief.goals, [], "brief.goals"),
            nonGoals: stringArray(brief.nonGoals, [], "brief.nonGoals"),
            assumptions: stringArray(brief.assumptions, [], "brief.assumptions"),
        },
        requirements: objectArray(
            source.requirements,
            [],
            "requirements",
            normalizeRequirement,
        ),
        experience: {
            jobStory: stringValue(experience.jobStory, "", "experience.jobStory"),
            principles: stringArray(experience.principles, [], "experience.principles"),
            flow: objectArray(experience.flow, [], "experience.flow", normalizeFlowStep),
            states: objectArray(experience.states, [], "experience.states", normalizeState),
        },
        ui: {
            visualDirection: stringValue(ui.visualDirection, "", "ui.visualDirection"),
            responsiveBehavior: stringValue(
                ui.responsiveBehavior,
                "",
                "ui.responsiveBehavior",
            ),
            contentGuidance: stringValue(ui.contentGuidance, "", "ui.contentGuidance"),
            screens: objectArray(ui.screens, [], "ui.screens", normalizeScreen),
            components: objectArray(ui.components, [], "ui.components", normalizeComponent),
        },
        delivery: {
            metrics: objectArray(delivery.metrics, [], "delivery.metrics", normalizeMetric),
            analytics: objectArray(
                delivery.analytics,
                [],
                "delivery.analytics",
                normalizeAnalytics,
            ),
            accessibility: objectArray(
                delivery.accessibility,
                defaults.delivery.accessibility,
                "delivery.accessibility",
                normalizeAccessibility,
            ),
            dependencies: stringArray(
                delivery.dependencies,
                [],
                "delivery.dependencies",
            ),
            risks: stringArray(delivery.risks, [], "delivery.risks"),
            openQuestions: stringArray(
                delivery.openQuestions,
                [],
                "delivery.openQuestions",
            ),
        },
    };
}

function filePath(storageDirectory, documentId) {
    if (!DOCUMENT_ID_PATTERN.test(documentId)) {
        throw new SpecValidationError("The document ID is invalid.");
    }
    return join(storageDirectory, `${documentId}.json`);
}

export async function loadSpec(storageDirectory, input) {
    const resolved = resolveOpenInput(input);
    await mkdir(storageDirectory, { recursive: true });
    const path = filePath(storageDirectory, resolved.documentId);

    try {
        const source = JSON.parse(await readFile(path, "utf8"));
        return normalizeSpec(source, resolved.documentId);
    } catch (error) {
        if (error.code !== "ENOENT") {
            if (error instanceof SyntaxError) {
                throw new SpecValidationError(`The specification file ${path} contains invalid JSON.`);
            }
            throw error;
        }
    }

    return saveSpec(
        storageDirectory,
        resolved.documentId,
        createDefaultSpec(resolved),
        { preserveUpdatedAt: true },
    );
}

export async function saveSpec(
    storageDirectory,
    documentId,
    value,
    { preserveUpdatedAt = false } = {},
) {
    await mkdir(storageDirectory, { recursive: true });
    const normalized = normalizeSpec(value, documentId);
    if (!preserveUpdatedAt) {
        normalized.meta.updatedAt = new Date().toISOString();
    }
    const path = filePath(storageDirectory, documentId);
    const previous = saveQueues.get(path) ?? Promise.resolve();
    // Each caller receives its own write error; a failed write must not block later saves.
    const write = previous
        .catch(() => {})
        .then(() => writeFile(path, `${JSON.stringify(normalized, null, 2)}\n`, "utf8"));
    saveQueues.set(path, write);
    try {
        await write;
    } finally {
        if (saveQueues.get(path) === write) {
            saveQueues.delete(path);
        }
    }
    return normalized;
}

function mergeValue(current, patch, path) {
    if (Array.isArray(patch)) {
        return structuredClone(patch);
    }
    if (!patch || typeof patch !== "object") {
        return patch;
    }
    if (!current || typeof current !== "object" || Array.isArray(current)) {
        throw new SpecValidationError(`${path} cannot be merged as an object.`);
    }

    const next = structuredClone(current);
    for (const [key, value] of Object.entries(patch)) {
        if (!(key in current)) {
            throw new SpecValidationError(`${path}.${key} is not a recognized specification field.`);
        }
        next[key] = mergeValue(current[key], value, `${path}.${key}`);
    }
    return next;
}

export function mergeSpec(current, patch) {
    assertObject(patch, "patch");
    return normalizeSpec(mergeValue(current, patch, "spec"), current.documentId);
}

export function addRequirement(spec, input) {
    const requirement = normalizeRequirement(
        {
            id: makeId("req"),
            title: input.title,
            priority: input.priority ?? "Should",
            status: input.status ?? "Proposed",
            owner: input.owner ?? "",
            description: input.description ?? "",
            acceptanceCriteria: input.acceptanceCriteria ?? "",
        },
        "requirement",
    );
    const next = structuredClone(spec);
    next.requirements.push(requirement);
    return { spec: next, requirement };
}

function markdownText(value) {
    return value.trim() || "_Not defined_";
}

function markdownList(values) {
    return values.length ? values.map((value) => `- ${value}`).join("\n") : "_None yet_";
}

function tableCell(value) {
    return (value || "-").replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

function markdownTable(headers, rows) {
    if (!rows.length) {
        return "_None yet_";
    }
    return [
        `| ${headers.join(" | ")} |`,
        `| ${headers.map(() => "---").join(" | ")} |`,
        ...rows.map((row) => `| ${row.map(tableCell).join(" | ")} |`),
    ].join("\n");
}

export function specToMarkdown(spec) {
    return `# ${spec.meta.title}

> **Status:** ${spec.meta.status} - **Owner:** ${spec.meta.owner || "Unassigned"} - **Updated:** ${spec.meta.updatedAt}

## Product brief

### One-line pitch

${markdownText(spec.brief.oneLiner)}

### Problem

${markdownText(spec.brief.problem)}

### Audience

${markdownText(spec.brief.audience)}

### Value proposition

${markdownText(spec.brief.value)}

### Goals

${markdownList(spec.brief.goals)}

### Non-goals

${markdownList(spec.brief.nonGoals)}

### Assumptions

${markdownList(spec.brief.assumptions)}

## Requirements

${markdownTable(
        ["Priority", "Requirement", "Status", "Owner", "Description", "Acceptance criteria"],
        spec.requirements.map((item) => [
            item.priority,
            item.title,
            item.status,
            item.owner,
            item.description,
            item.acceptanceCriteria,
        ]),
    )}

## Experience

### Job story

${markdownText(spec.experience.jobStory)}

### Experience principles

${markdownList(spec.experience.principles)}

### Primary flow

${markdownTable(
        ["Step", "Actor", "Description"],
        spec.experience.flow.map((item) => [item.name, item.actor, item.description]),
    )}

### UI states

${markdownTable(
        ["Surface", "State", "Trigger", "Expected behavior"],
        spec.experience.states.map((item) => [
            item.surface,
            item.state,
            item.trigger,
            item.behavior,
        ]),
    )}

## Interface specification

### Visual direction

${markdownText(spec.ui.visualDirection)}

### Responsive behavior

${markdownText(spec.ui.responsiveBehavior)}

### Content guidance

${markdownText(spec.ui.contentGuidance)}

### Screens

${markdownTable(
        ["Screen", "Purpose", "Primary action", "Notes"],
        spec.ui.screens.map((item) => [
            item.name,
            item.purpose,
            item.primaryAction,
            item.notes,
        ]),
    )}

### Components

${markdownTable(
        ["Component", "Behavior", "Variants"],
        spec.ui.components.map((item) => [item.name, item.behavior, item.variants]),
    )}

## Delivery and validation

### Success metrics

${markdownTable(
        ["Metric", "Target", "Signal/source"],
        spec.delivery.metrics.map((item) => [item.name, item.target, item.signal]),
    )}

### Analytics

${markdownTable(
        ["Event", "Trigger", "Properties"],
        spec.delivery.analytics.map((item) => [item.name, item.trigger, item.properties]),
    )}

### Accessibility

${markdownTable(
        ["Check", "Status", "Notes"],
        spec.delivery.accessibility.map((item) => [item.label, item.status, item.notes]),
    )}

### Dependencies

${markdownList(spec.delivery.dependencies)}

### Risks

${markdownList(spec.delivery.risks)}

### Open questions

${markdownList(spec.delivery.openQuestions)}
`;
}

export async function exportSpec(storageDirectory, spec) {
    await mkdir(storageDirectory, { recursive: true });
    const path = join(storageDirectory, `${spec.documentId}.md`);
    await writeFile(path, specToMarkdown(spec), "utf8");
    return path;
}
