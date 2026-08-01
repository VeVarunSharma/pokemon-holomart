import { randomUUID } from "node:crypto";
import {
    access,
    mkdir,
    readFile,
    rename,
    rm,
    writeFile,
} from "node:fs/promises";
import { dirname } from "node:path";

const ITEM_KEYS = new Set([
    "category",
    "description",
    "id",
    "owner",
    "progress",
    "quarter",
    "status",
    "targetDate",
    "title",
]);
const UPDATE_KEYS = new Set([...ITEM_KEYS].filter((key) => key !== "id"));
const STATUSES = new Set(["planned", "in-progress", "at-risk", "done"]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class RoadmapStoreError extends Error {
    constructor(code, message) {
        super(message);
        this.name = "RoadmapStoreError";
        this.code = code;
    }
}

function isRecord(value) {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function requireRecord(value, label) {
    if (!isRecord(value)) {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            `${label} must be a JSON object.`,
        );
    }
    return value;
}

function requireString(value, label, maxLength) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            `${label} must be a non-empty string.`,
        );
    }
    if (value.length > maxLength) {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            `${label} must be ${maxLength} characters or fewer.`,
        );
    }
    return value.trim();
}

function optionalString(value, label, maxLength) {
    if (value === undefined || value === null) {
        return "";
    }
    if (typeof value !== "string") {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            `${label} must be a string.`,
        );
    }
    if (value.length > maxLength) {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            `${label} must be ${maxLength} characters or fewer.`,
        );
    }
    return value.trim();
}

function assertAllowedKeys(value, allowedKeys, label) {
    const unknownKey = Object.keys(value).find(
        (key) => !allowedKeys.has(key),
    );
    if (unknownKey) {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            `${label} contains an unsupported field: ${unknownKey}.`,
        );
    }
}

function validateId(value, label) {
    const id = requireString(value, label, 80);
    if (!ID_PATTERN.test(id)) {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            `${label} may only contain letters, numbers, dots, underscores, and hyphens.`,
        );
    }
    return id;
}

function validateDate(value, label) {
    const date = optionalString(value, label, 10);
    if (date.length === 0) {
        return "";
    }
    if (!DATE_PATTERN.test(date)) {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            `${label} must use YYYY-MM-DD format.`,
        );
    }

    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (
        Number.isNaN(parsed.valueOf()) ||
        parsed.toISOString().slice(0, 10) !== date
    ) {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            `${label} must be a valid calendar date.`,
        );
    }
    return date;
}

function validateProgress(value) {
    if (
        !Number.isInteger(value) ||
        value < 0 ||
        value > 100
    ) {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            "Item progress must be an integer from 0 to 100.",
        );
    }
    return value;
}

function validateStatus(value) {
    if (typeof value !== "string" || !STATUSES.has(value)) {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            "Item status must be planned, in-progress, at-risk, or done.",
        );
    }
    return value;
}

function createItemId(title) {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
    return `${slug || "roadmap-item"}-${randomUUID().slice(0, 8)}`;
}

function normalizeItem(input, existingItem) {
    const value = requireRecord(input, "Roadmap item");
    assertAllowedKeys(
        value,
        existingItem ? UPDATE_KEYS : ITEM_KEYS,
        "Roadmap item",
    );

    const merged = existingItem
        ? { ...existingItem, ...value, id: existingItem.id }
        : value;
    const title = requireString(merged.title, "Item title", 160);
    const id = existingItem
        ? existingItem.id
        : merged.id === undefined
          ? createItemId(title)
          : validateId(merged.id, "Item ID");

    return {
        id,
        title,
        description: optionalString(
            merged.description,
            "Item description",
            2000,
        ),
        quarter: requireString(merged.quarter, "Item quarter", 80),
        status: validateStatus(merged.status ?? "planned"),
        category:
            optionalString(merged.category, "Item category", 80) ||
            "General",
        owner: optionalString(merged.owner, "Item owner", 120),
        progress: validateProgress(merged.progress ?? 0),
        targetDate: validateDate(merged.targetDate, "Item target date"),
    };
}

function validateQuarter(value, index) {
    const quarter = requireRecord(value, `Quarter ${index + 1}`);
    assertAllowedKeys(
        quarter,
        new Set(["id", "label", "objective"]),
        `Quarter ${index + 1}`,
    );
    return {
        id: validateId(quarter.id, `Quarter ${index + 1} ID`),
        label: requireString(
            quarter.label,
            `Quarter ${index + 1} label`,
            80,
        ),
        objective: optionalString(
            quarter.objective,
            `Quarter ${index + 1} objective`,
            160,
        ),
    };
}

function validateRoadmap(value) {
    const roadmap = requireRecord(value, "Roadmap");
    if (roadmap.version !== 1) {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            "Roadmap version must be 1.",
        );
    }

    if (!Array.isArray(roadmap.quarters) || roadmap.quarters.length === 0) {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            "Roadmap quarters must be a non-empty array.",
        );
    }
    if (!Array.isArray(roadmap.items)) {
        throw new RoadmapStoreError(
            "roadmap_validation_failed",
            "Roadmap items must be an array.",
        );
    }

    const quarters = roadmap.quarters.map(validateQuarter);
    const quarterIds = new Set();
    for (const quarter of quarters) {
        if (quarterIds.has(quarter.id)) {
            throw new RoadmapStoreError(
                "roadmap_validation_failed",
                `Quarter ID ${quarter.id} is duplicated.`,
            );
        }
        quarterIds.add(quarter.id);
    }

    const items = roadmap.items.map((item) => normalizeItem(item));
    const itemIds = new Set();
    for (const item of items) {
        if (itemIds.has(item.id)) {
            throw new RoadmapStoreError(
                "roadmap_validation_failed",
                `Roadmap item ID ${item.id} is duplicated.`,
            );
        }
        if (!quarterIds.has(item.quarter)) {
            throw new RoadmapStoreError(
                "roadmap_validation_failed",
                `Roadmap item ${item.id} references unknown quarter ${item.quarter}.`,
            );
        }
        itemIds.add(item.id);
    }

    return {
        version: 1,
        title: requireString(roadmap.title, "Roadmap title", 160),
        subtitle: optionalString(
            roadmap.subtitle,
            "Roadmap subtitle",
            300,
        ),
        updatedAt: optionalString(
            roadmap.updatedAt,
            "Roadmap updatedAt",
            40,
        ),
        quarters,
        items,
    };
}

function defaultRoadmap() {
    return {
        version: 1,
        title: "GitHub Copilot for Product Roadmap",
        subtitle:
            "A shared view of product outcomes, experiments, and delivery milestones.",
        updatedAt: "2026-07-30T14:04:42.928Z",
        quarters: [
            {
                id: "2026-q3",
                label: "Q3 2026",
                objective: "Discover and align",
            },
            {
                id: "2026-q4",
                label: "Q4 2026",
                objective: "Pilot and learn",
            },
            {
                id: "2027-q1",
                label: "Q1 2027",
                objective: "Launch and measure",
            },
            {
                id: "2027-q2",
                label: "Q2 2027",
                objective: "Scale and optimize",
            },
        ],
        items: [],
    };
}

export class RoadmapStore {
    constructor(path) {
        this.path = path;
        this.pendingWrite = Promise.resolve();
    }

    async initialize() {
        try {
            await access(this.path);
        } catch (error) {
            if (error?.code !== "ENOENT") {
                throw error;
            }
            await mkdir(dirname(this.path), { recursive: true });
            await this.write(defaultRoadmap());
        }
        return this.read();
    }

    async read() {
        await this.initializeIfMissing();
        let contents;
        try {
            contents = await readFile(this.path, "utf8");
        } catch (error) {
            throw new RoadmapStoreError(
                "roadmap_read_failed",
                `Could not read roadmap.json: ${error.message}`,
            );
        }

        let parsed;
        try {
            parsed = JSON.parse(contents);
        } catch (error) {
            throw new RoadmapStoreError(
                "roadmap_invalid_json",
                `roadmap.json contains invalid JSON: ${error.message}`,
            );
        }
        return validateRoadmap(parsed);
    }

    async addItem(input) {
        return this.mutate((roadmap) => {
            const item = normalizeItem(input);
            if (roadmap.items.some((candidate) => candidate.id === item.id)) {
                throw new RoadmapStoreError(
                    "roadmap_item_exists",
                    `A roadmap item with ID ${item.id} already exists.`,
                );
            }
            this.assertQuarterExists(roadmap, item.quarter);
            roadmap.items.push(item);
            return item;
        });
    }

    async updateItem(id, changes) {
        const itemId = validateId(id, "Item ID");
        return this.mutate((roadmap) => {
            const index = roadmap.items.findIndex(
                (item) => item.id === itemId,
            );
            if (index === -1) {
                throw new RoadmapStoreError(
                    "roadmap_item_not_found",
                    `Roadmap item ${itemId} was not found.`,
                );
            }

            const item = normalizeItem(changes, roadmap.items[index]);
            this.assertQuarterExists(roadmap, item.quarter);
            roadmap.items[index] = item;
            return item;
        });
    }

    async removeItem(id) {
        const itemId = validateId(id, "Item ID");
        return this.mutate((roadmap) => {
            const index = roadmap.items.findIndex(
                (item) => item.id === itemId,
            );
            if (index === -1) {
                throw new RoadmapStoreError(
                    "roadmap_item_not_found",
                    `Roadmap item ${itemId} was not found.`,
                );
            }
            const [item] = roadmap.items.splice(index, 1);
            return item;
        });
    }

    async initializeIfMissing() {
        try {
            await access(this.path);
        } catch (error) {
            if (error?.code !== "ENOENT") {
                throw error;
            }
            await mkdir(dirname(this.path), { recursive: true });
            await this.write(defaultRoadmap());
        }
    }

    assertQuarterExists(roadmap, quarterId) {
        if (!roadmap.quarters.some((quarter) => quarter.id === quarterId)) {
            throw new RoadmapStoreError(
                "roadmap_quarter_not_found",
                `Roadmap quarter ${quarterId} was not found.`,
            );
        }
    }

    mutate(mutator) {
        const run = async () => {
            const roadmap = await this.read();
            const item = mutator(roadmap);
            roadmap.updatedAt = new Date().toISOString();
            await this.write(roadmap);
            return { item, roadmap };
        };

        const operation = this.pendingWrite.then(run, run);
        this.pendingWrite = operation.then(
            () => undefined,
            () => undefined,
        );
        return operation;
    }

    async write(value) {
        const roadmap = validateRoadmap(value);
        const temporaryPath = `${this.path}.${process.pid}.${randomUUID()}.tmp`;
        await mkdir(dirname(this.path), { recursive: true });

        try {
            await writeFile(
                temporaryPath,
                `${JSON.stringify(roadmap, null, 2)}\n`,
                "utf8",
            );
            await rename(temporaryPath, this.path);
        } finally {
            await rm(temporaryPath, { force: true });
        }
    }
}
