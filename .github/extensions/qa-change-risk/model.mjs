import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CAPABILITY_RULES,
  PROVENANCE_LABEL,
  TEST_DEFINITIONS,
  isAllowlistedTestPath,
  normalizeRepoPath,
  rulesForPath,
  safeCommandFor,
} from "./repo-config.mjs";

const LEVELS = new Set(["low", "medium", "high", "unknown"]);
const RESULT_STATUSES = new Set(["pass", "fail", "blocked", "skipped", "not-run"]);
const REVIEW_STATUSES = new Set(["unreviewed", "accepted", "questioned"]);
const MANUAL_CATEGORIES = new Set(["unit", "integration", "accessibility", "exploratory"]);
const MAX_GIT_OUTPUT = 12 * 1024 * 1024;
export const MAX_RUN_OUTPUT = 64 * 1024;

export class QAError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "QAError";
    this.code = code;
  }
}

export function projectWorkspaceFromExtension(extensionUrl) {
  return path.resolve(path.dirname(fileURLToPath(extensionUrl)), "..", "..", "..");
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function stripAnsi(value) {
  return String(value ?? "")
    .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, "")
    .replace(/\u001b(?:[@-_]|\[[0-?]*[ -/]*[@-~])/g, "")
    .replace(/[^\t\n\r\x20-\x7e]/g, "");
}

export function appendBoundedOutput(current, chunk, limit = MAX_RUN_OUTPUT) {
  const clean = stripAnsi(chunk);
  const combined = `${current ?? ""}${clean}`;
  if (combined.length <= limit) return { output: combined, truncated: false };
  const marker = "[Earlier output truncated]\n";
  return {
    output: marker + combined.slice(-(limit - marker.length)),
    truncated: true,
  };
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

export function resolveWorkspacePath(workspacePath, requestedPath, requiredPrefix = null) {
  if (typeof requestedPath !== "string" || requestedPath.trim() === "" || requestedPath.includes("\0")) {
    throw new QAError("path_invalid", "Path must be a non-empty workspace-relative string.");
  }
  if (path.isAbsolute(requestedPath)) {
    throw new QAError("path_invalid", "Absolute paths are not allowed.");
  }
  const normalized = normalizeRepoPath(requestedPath);
  const resolved = path.resolve(workspacePath, normalized);
  if (!contained(path.resolve(workspacePath), resolved)) {
    throw new QAError("path_invalid", `Path escapes the repository: ${requestedPath}`);
  }
  if (requiredPrefix) {
    const prefixRoot = path.resolve(workspacePath, requiredPrefix);
    if (!contained(prefixRoot, resolved)) {
      throw new QAError("path_invalid", `Path must remain under ${normalizeRepoPath(requiredPrefix)}/.`);
    }
  }
  return {
    absolutePath: resolved,
    relativePath: normalizeRepoPath(path.relative(path.resolve(workspacePath), resolved)),
  };
}

export function validateAnalysisId(value) {
  const candidate = value ?? "working-tree";
  if (typeof candidate !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(candidate)) {
    throw new QAError("analysis_id_invalid", "analysisId must be 1-64 characters using letters, digits, dot, underscore, or hyphen.");
  }
  return candidate;
}

export function analysisStateFileName(value) {
  const analysisId = validateAnalysisId(value);
  return `analysis-${createHash("sha256").update(analysisId).digest("hex")}.json`;
}

export function validateBaseRef(value) {
  if (value === undefined || value === null || value === "") return null;
  if (
    typeof value !== "string" ||
    value.length > 200 ||
    !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) ||
    value.includes("..") ||
    value.includes("//") ||
    value.endsWith("/")
  ) {
    throw new QAError("base_ref_invalid", "baseRef must be a simple local Git revision name.");
  }
  return value;
}

export function validateFocusPaths(workspacePath, values) {
  if (values === undefined) return [];
  if (!Array.isArray(values) || values.length > 50) {
    throw new QAError("focus_paths_invalid", "focusPaths must be an array with at most 50 workspace-relative paths.");
  }
  return [...new Set(values.map((value) => resolveWorkspacePath(workspacePath, value).relativePath))];
}

function decodeGitPath(value) {
  const candidate = String(value ?? "");
  if (candidate.startsWith('"') && candidate.endsWith('"')) {
    try {
      return JSON.parse(candidate);
    } catch {
      return candidate.slice(1, -1);
    }
  }
  return candidate;
}

export function parsePorcelainZ(raw) {
  if (!raw) return [];
  const tokens = String(raw).split("\0");
  const records = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    if (token.length < 4 || token[2] !== " ") {
      throw new QAError("git_status_invalid", "Git status output had an unexpected record.");
    }
    const indexStatus = token[0];
    const worktreeStatus = token[1];
    const filePath = normalizeRepoPath(decodeGitPath(token.slice(3)));
    let originalPath = null;
    if (/[RC]/.test(`${indexStatus}${worktreeStatus}`)) {
      originalPath = normalizeRepoPath(decodeGitPath(tokens[index + 1] ?? ""));
      index += 1;
      if (!originalPath) throw new QAError("git_status_invalid", "Git rename/copy record omitted its original path.");
    }
    records.push({
      path: filePath,
      originalPath,
      indexStatus,
      worktreeStatus,
      staged: ![" ", "?"].includes(indexStatus),
      unstaged: ![" ", "?"].includes(worktreeStatus),
      untracked: indexStatus === "?" && worktreeStatus === "?",
      changeType: changeType(indexStatus, worktreeStatus),
    });
  }
  return records;
}

function changeType(indexStatus, worktreeStatus) {
  const combined = `${indexStatus}${worktreeStatus}`;
  if (combined === "??") return "untracked";
  if (combined.includes("U") || ["AA", "DD"].includes(combined)) return "conflicted";
  if (combined.includes("R")) return "renamed";
  if (combined.includes("C")) return "copied";
  if (combined.includes("D")) return "deleted";
  if (combined.includes("A")) return "added";
  if (combined.includes("T")) return "type-changed";
  if (combined.includes("M")) return "modified";
  return "changed";
}

function parseCount(value) {
  if (value === "-") return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new QAError("git_numstat_invalid", `Invalid numstat count: ${value}`);
  }
  return parsed;
}

export function parseNumstatZ(raw) {
  if (!raw) return [];
  const tokens = String(raw).split("\0");
  const records = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    const firstTab = token.indexOf("\t");
    const secondTab = token.indexOf("\t", firstTab + 1);
    if (firstTab < 0 || secondTab < 0) {
      throw new QAError("git_numstat_invalid", "Git numstat output had an unexpected record.");
    }
    const added = parseCount(token.slice(0, firstTab));
    const deleted = parseCount(token.slice(firstTab + 1, secondTab));
    let filePath = normalizeRepoPath(decodeGitPath(token.slice(secondTab + 1)));
    let originalPath = null;
    if (!filePath) {
      originalPath = normalizeRepoPath(decodeGitPath(tokens[index + 1] ?? ""));
      filePath = normalizeRepoPath(decodeGitPath(tokens[index + 2] ?? ""));
      index += 2;
      if (!originalPath || !filePath) {
        throw new QAError("git_numstat_invalid", "Git rename numstat record was incomplete.");
      }
    }
    records.push({
      path: filePath,
      originalPath,
      added,
      deleted,
      binary: added === null || deleted === null,
    });
  }
  return records;
}

function nameStatusChangeType(status) {
  if (status === "A") return "added";
  if (status === "D") return "deleted";
  if (status === "R") return "renamed";
  if (status === "C") return "copied";
  if (status === "T") return "type-changed";
  if (status === "U") return "conflicted";
  if (status === "M") return "modified";
  throw new QAError("git_name_status_invalid", `Unsupported Git name-status code: ${status}`);
}

export function parseNameStatusZ(raw) {
  if (!raw) return [];
  const tokens = String(raw).split("\0");
  const records = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    const inline = /^([A-Z])\d*\t(.*)$/.exec(token);
    const statusToken = inline ? token.slice(0, token.indexOf("\t")) : token;
    const status = statusToken[0];
    if (!/^[A-Z]\d*$/.test(statusToken)) {
      throw new QAError("git_name_status_invalid", "Git name-status output had an unexpected record.");
    }
    let firstPath = inline ? inline[2] : tokens[++index];
    if (firstPath === undefined) throw new QAError("git_name_status_invalid", "Git name-status record omitted its path.");
    firstPath = normalizeRepoPath(decodeGitPath(firstPath));
    if (["R", "C"].includes(status)) {
      const secondPath = normalizeRepoPath(decodeGitPath(tokens[++index] ?? ""));
      if (!firstPath || !secondPath) throw new QAError("git_name_status_invalid", "Git rename/copy record was incomplete.");
      records.push({
        path: secondPath,
        originalPath: firstPath,
        status,
        changeType: nameStatusChangeType(status),
      });
    } else {
      if (!firstPath) throw new QAError("git_name_status_invalid", "Git name-status path was empty.");
      records.push({
        path: firstPath,
        originalPath: null,
        status,
        changeType: nameStatusChangeType(status),
      });
    }
  }
  return records;
}

function diffPath(value) {
  const withoutTimestamp = String(value ?? "").split("\t", 1)[0];
  const decoded = decodeGitPath(withoutTimestamp);
  if (decoded === "/dev/null") return null;
  return normalizeRepoPath(decoded.replace(/^[ab]\//, ""));
}

export function parseUnifiedDiffHunks(raw) {
  const hunks = new Map();
  let oldPath = null;
  let currentPath = null;
  for (const line of String(raw ?? "").split(/\r?\n/)) {
    if (line.startsWith("--- ")) {
      oldPath = diffPath(line.slice(4));
      continue;
    }
    if (line.startsWith("+++ ")) {
      currentPath = diffPath(line.slice(4)) ?? oldPath;
      continue;
    }
    if (!line.startsWith("@@") || !currentPath) continue;
    const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (!match) continue;
    const range = {
      oldStart: Number.parseInt(match[1], 10),
      oldCount: match[2] === undefined ? 1 : Number.parseInt(match[2], 10),
      newStart: Number.parseInt(match[3], 10),
      newCount: match[4] === undefined ? 1 : Number.parseInt(match[4], 10),
    };
    const existing = hunks.get(currentPath) ?? [];
    existing.push(range);
    hunks.set(currentPath, existing);
  }
  return hunks;
}

function runGit(workspacePath, args) {
  return new Promise((resolve, reject) => {
    execFile("git", args, {
      cwd: workspacePath,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: MAX_GIT_OUTPUT,
    }, (error, stdout, stderr) => {
      if (error) {
        const detail = stripAnsi(stderr || error.message).trim();
        reject(new QAError("git_command_failed", detail || `Git command failed: git ${args[0]}`));
        return;
      }
      resolve(stdout);
    });
  });
}

async function resolveRepository(workspacePath) {
  let reportedRoot;
  try {
    reportedRoot = (await runGit(workspacePath, ["rev-parse", "--show-toplevel"])).trim();
  } catch (error) {
    if (error instanceof QAError) {
      throw new QAError("not_git_repository", "QA Change-Risk requires a local Git repository.");
    }
    throw error;
  }
  const [actualRoot, requestedRoot] = await Promise.all([
    realpath(reportedRoot),
    realpath(workspacePath),
  ]);
  if (actualRoot !== requestedRoot) {
    throw new QAError("repository_root_mismatch", "The extension must run from the repository root.");
  }
  return requestedRoot;
}

async function resolveBaseCommit(workspacePath, baseRef) {
  const expression = `${baseRef ?? "HEAD"}^{commit}`;
  try {
    return (await runGit(workspacePath, ["rev-parse", "--verify", "--end-of-options", expression])).trim();
  } catch {
    throw new QAError("base_ref_not_found", `Local Git revision was not found: ${baseRef ?? "HEAD"}`);
  }
}

async function resolveComparisonBase(workspacePath, baseRefCommit, baseRef) {
  if (!baseRef) return baseRefCommit;
  try {
    return (await runGit(workspacePath, ["merge-base", baseRefCommit, "HEAD"])).trim();
  } catch {
    throw new QAError("base_ref_unrelated", `Local Git revision has no merge base with HEAD: ${baseRef}`);
  }
}

async function hashWorkingPath(workspacePath, change) {
  if (change.changeType === "deleted") return "deleted";
  try {
    return (await runGit(workspacePath, ["hash-object", "--no-filters", "--", change.path])).trim();
  } catch {
    return `unavailable:${change.changeType}:${change.added ?? "?"}:${change.deleted ?? "?"}`;
  }
}

async function hashRepositoryPath(workspacePath, filePath) {
  try {
    return (await runGit(workspacePath, ["hash-object", "--no-filters", "--", filePath])).trim();
  } catch {
    return "unavailable";
  }
}

function focusMatch(change, focusPaths) {
  if (!focusPaths.length) return true;
  const changedPaths = [change.path, change.originalPath].filter(Boolean);
  return focusPaths.some((focus) =>
    focus === "" || changedPaths.some((filePath) => filePath === focus || filePath.startsWith(`${focus}/`)));
}

function mergeChangeEvidence(statusRecords, nameStatusRecords, numstatRecords, hunks) {
  const stats = new Map();
  for (const item of numstatRecords) {
    stats.set(item.path, item);
    if (item.originalPath) stats.set(item.originalPath, item);
  }
  const authoritative = new Map();
  for (const item of nameStatusRecords) {
    authoritative.set(item.path, item);
    if (item.originalPath) authoritative.set(item.originalPath, item);
  }
  const statusPaths = new Set(statusRecords.flatMap((item) => [item.path, item.originalPath].filter(Boolean)));
  const branchRecords = nameStatusRecords
    .filter((item) => !statusPaths.has(item.path) && !statusPaths.has(item.originalPath))
    .map((item) => ({
      path: item.path,
      originalPath: item.originalPath,
      indexStatus: " ",
      worktreeStatus: " ",
      staged: false,
      unstaged: false,
      untracked: false,
      branchComparison: true,
      changeType: item.changeType,
    }));
  return [...statusRecords, ...branchRecords].map((statusRecord) => {
    const numeric = stats.get(statusRecord.path) ?? stats.get(statusRecord.originalPath);
    const named = authoritative.get(statusRecord.path) ?? authoritative.get(statusRecord.originalPath);
    return {
      ...statusRecord,
      originalPath: statusRecord.originalPath ?? named?.originalPath ?? null,
      changeType: named?.changeType ?? statusRecord.changeType,
      comparisonChange: Boolean(named),
      added: numeric?.added ?? null,
      deleted: numeric?.deleted ?? null,
      binary: numeric?.binary ?? false,
      hunks: hunks.get(statusRecord.path) ?? hunks.get(statusRecord.originalPath) ?? [],
    };
  }).sort((a, b) => a.path.localeCompare(b.path));
}

function evidenceForChange(change) {
  if (!change.hunks.length) {
    return [{ path: change.path, line: null, limitation: "No changed text line was available (for example, untracked, binary, or deleted content)." }];
  }
  return change.hunks.map((hunk) => ({
    path: change.path,
    line: hunk.newCount === 0 ? hunk.oldStart : hunk.newStart,
    endLine: hunk.newCount > 1 ? hunk.newStart + hunk.newCount - 1 : undefined,
  }));
}

function skipQuoted(source, start, quote) {
  for (let index = start + 1; index < source.length; index += 1) {
    if (source[index] === "\\") {
      index += 1;
      continue;
    }
    if (source[index] === quote) return index + 1;
  }
  return source.length;
}

function regexCanStart(source, index) {
  const prefix = source.slice(0, index).trimEnd();
  if (!prefix) return true;
  const previous = prefix.at(-1);
  if (/[([{:;,=!?&|^~<>+\-*%]/.test(previous)) return true;
  const keyword = /([A-Za-z_$][\w$]*)$/.exec(prefix)?.[1];
  return ["return", "throw", "case", "delete", "void", "typeof", "instanceof", "in", "of", "yield", "await"].includes(keyword);
}

function skipRegex(source, start) {
  let inCharacterClass = false;
  for (let index = start + 1; index < source.length; index += 1) {
    const character = source[index];
    if (character === "\\") {
      index += 1;
      continue;
    }
    if (character === "[") inCharacterClass = true;
    else if (character === "]") inCharacterClass = false;
    else if (character === "/" && !inCharacterClass) {
      while (/[A-Za-z]/.test(source[index + 1] ?? "")) index += 1;
      return index + 1;
    } else if (character === "\n" || character === "\r") {
      return start + 1;
    }
  }
  return start + 1;
}

function maskNonCode(source) {
  const characters = [...source];
  const mask = (start, end) => {
    for (let index = start; index < end; index += 1) {
      if (!["\r", "\n"].includes(characters[index])) characters[index] = " ";
    }
  };
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (["'", '"', "`"].includes(character)) {
      const end = skipQuoted(source, index, character);
      mask(index, end);
      index = end - 1;
    } else if (character === "/" && next === "/") {
      const newline = source.indexOf("\n", index + 2);
      const end = newline < 0 ? source.length : newline;
      mask(index, end);
      index = end - 1;
    } else if (character === "/" && next === "*") {
      const close = source.indexOf("*/", index + 2);
      const end = close < 0 ? source.length : close + 2;
      mask(index, end);
      index = end - 1;
    } else if (character === "/" && regexCanStart(source, index)) {
      const end = skipRegex(source, index);
      mask(index, end);
      index = end - 1;
    }
  }
  return characters.join("");
}

function callArguments(source, openIndex) {
  const args = [];
  let argumentStart = openIndex + 1;
  let braces = 0;
  let brackets = 0;
  let parentheses = 0;
  for (let index = openIndex + 1; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (["'", '"', "`"].includes(character)) {
      index = skipQuoted(source, index, character) - 1;
      continue;
    }
    if (character === "/" && next === "/") {
      const newline = source.indexOf("\n", index + 2);
      index = newline < 0 ? source.length : newline;
      continue;
    }
    if (character === "/" && next === "*") {
      const close = source.indexOf("*/", index + 2);
      index = close < 0 ? source.length : close + 1;
      continue;
    }
    if (character === "/" && regexCanStart(source, index)) {
      index = skipRegex(source, index) - 1;
      continue;
    }
    if (character === "{") braces += 1;
    else if (character === "}") braces = Math.max(0, braces - 1);
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets = Math.max(0, brackets - 1);
    else if (character === "(") parentheses += 1;
    else if (character === ")") {
      if (parentheses === 0 && braces === 0 && brackets === 0) {
        const finalArgument = source.slice(argumentStart, index).trim();
        if (finalArgument || args.length) args.push(finalArgument);
        return args;
      }
      parentheses = Math.max(0, parentheses - 1);
    } else if (character === "," && parentheses === 0 && braces === 0 && brackets === 0) {
      args.push(source.slice(argumentStart, index).trim());
      argumentStart = index + 1;
    }
  }
  return [];
}

function isInlineTestCallback(value) {
  return /^(?:async\s+)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/.test(value.trim());
}

function classifyTestOptions(options) {
  if (
    /\.\.\./.test(options) ||
    /(?:^|[{,])\s*\[/.test(options) ||
    options.includes("\\")
  ) {
    return "disabled";
  }
  const properties = { skip: [], todo: [] };
  const propertyPattern = /(?:^|[{,])\s*(?:(["'])(skip|todo)\1|(skip|todo))\s*:/g;
  for (const match of options.matchAll(propertyPattern)) {
    const key = match[2] ?? match[3];
    const remainder = options.slice((match.index ?? 0) + match[0].length).trimStart();
    properties[key].push(/^false\s*(?:,|})/.test(remainder));
  }
  const ambiguousPattern = /(?:^|[{,])\s*(?:(?:get|set|async)\s+)?(?:\*\s*)?(?:(["'])(skip|todo)\1|(skip|todo))\s*(?:\(|,|})/g;
  for (const match of options.matchAll(ambiguousPattern)) {
    const key = match[2] ?? match[3];
    properties[key].push(false);
  }
  if (properties.todo.length > 1 || properties.todo.includes(false)) return "todo";
  if (properties.skip.length > 1 || properties.skip.includes(false)) return "disabled";
  return "active";
}

function bindingMayBeShadowed(source, binding) {
  const escaped = binding.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [
    new RegExp(`\\b(?:const|let|var|class|function)\\b[^;\\n{}]*\\b${escaped}\\b`),
    new RegExp(`\\b(?:const|let|var)\\s*[\\[{][^\\]}\\n]*\\b${escaped}\\b`),
    new RegExp(`\\b[A-Za-z_$][\\w$]*\\s*\\([^)]*\\b${escaped}\\b[^)]*\\)\\s*(?:=>|\\{)`),
    new RegExp(`\\([^)]*\\b${escaped}\\b[^)]*\\)\\s*=>`),
    new RegExp(`\\b${escaped}\\s*=>`),
  ].some((pattern) => pattern.test(source));
}

export function scanTestDeclarations(source) {
  const activeLines = [];
  let todoCount = 0;
  let disabledCount = 0;
  const bindings = new Set();
  const definitionRanges = [];
  const codeSource = maskNonCode(source);
  const register = (match, keyword, handler) => {
    const keywordOffset = match[0].indexOf(keyword);
    const codeIndex = (match.index ?? 0) + keywordOffset;
    if (codeSource.slice(codeIndex, codeIndex + keyword.length) !== keyword) return;
    handler();
    definitionRanges.push([match.index ?? 0, (match.index ?? 0) + match[0].length]);
  };
  const addNamedBindings = (value) => {
    for (const item of value.split(",")) {
      const match = /^\s*(test|it)(?:\s+as\s+([A-Za-z_$][\w$]*))?\s*$/.exec(item);
      if (match) bindings.add(match[2] ?? match[1]);
    }
  };
  for (const match of source.matchAll(/^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+["']node:test["']/gm)) {
    register(match, "import", () => bindings.add(match[1]));
  }
  for (const match of source.matchAll(/^\s*import\s*\{([^}\r\n]+)\}\s*from\s+["']node:test["']/gm)) {
    register(match, "import", () => addNamedBindings(match[1]));
  }
  for (const match of source.matchAll(/^\s*import\s+([A-Za-z_$][\w$]*)\s*,\s*\{([^}\r\n]+)\}\s*from\s+["']node:test["']/gm)) {
    register(match, "import", () => {
      bindings.add(match[1]);
      addNamedBindings(match[2]);
    });
  }
  for (const match of source.matchAll(/^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*["']node:test["']\s*\)/gm)) {
    register(match, "const", () => bindings.add(match[1]));
  }
  for (const match of source.matchAll(/^\s*const\s*\{([^}\r\n]+)\}\s*=\s*require\(\s*["']node:test["']\s*\)/gm)) {
    register(match, "const", () => {
      for (const item of match[1].split(",")) {
        const named = /^\s*(test|it)(?:\s*:\s*([A-Za-z_$][\w$]*))?\s*$/.exec(item);
        if (named) bindings.add(named[2] ?? named[1]);
      }
    });
  }
  const shadowCharacters = [...codeSource];
  for (const [start, end] of definitionRanges) {
    for (let index = start; index < end; index += 1) {
      if (!["\r", "\n"].includes(shadowCharacters[index])) shadowCharacters[index] = " ";
    }
  }
  const shadowSource = shadowCharacters.join("");
  const declarations = [...bindings]
    .filter((binding) => !bindingMayBeShadowed(shadowSource, binding))
    .sort((left, right) => right.length - left.length)
    .map((binding) => ({
      binding,
      pattern: new RegExp(`^${binding.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s*\\.\\s*(only|skip|todo))?\\s*\\(`),
    }));
  let braceDepth = 0;
  for (let index = 0; index < source.length; index += 1) {
    const character = codeSource[index];
    if (character === "{") {
      braceDepth += 1;
      continue;
    }
    if (character === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
    if (braceDepth !== 0) continue;
    const lineStart = codeSource.lastIndexOf("\n", index - 1) + 1;
    if (codeSource.slice(lineStart, index).trim() !== "") continue;
    const previousCode = codeSource.slice(0, lineStart).trimEnd();
    if (previousCode && !/[;}]\s*$/.test(previousCode)) continue;
    const before = codeSource[index - 1] ?? "";
    if (/[A-Za-z0-9_$.]/.test(before)) continue;
    const match = declarations
      .map(({ pattern }) => pattern.exec(codeSource.slice(index)))
      .find(Boolean);
    if (!match) continue;
    const line = source.slice(0, index).split("\n").length;
    if (match[1] === "todo") {
      todoCount += 1;
      continue;
    }
    if (match[1] === "skip") {
      disabledCount += 1;
      continue;
    }
    const openIndex = index + match[0].lastIndexOf("(");
    const args = callArguments(source, openIndex);
    const firstArgument = args[0] ?? "";
    let options = null;
    if (firstArgument.startsWith("{")) {
      options = firstArgument;
    } else if (args.length >= 3) {
      options = args[1];
    } else if (args.length === 2 && args[1].startsWith("{")) {
      options = args[1];
    } else if (
      args.length === 2 &&
      (!/^(['"`])/.test(firstArgument) || !isInlineTestCallback(args[1]))
    ) {
      disabledCount += 1;
      continue;
    }
    if (options === null) {
      activeLines.push(line);
      continue;
    }
    options = options
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\r\n]*/g, "")
      .trim();
    if (!options.startsWith("{")) {
      disabledCount += 1;
      continue;
    }
    const classification = classifyTestOptions(options);
    if (classification === "todo") todoCount += 1;
    else if (classification === "disabled") disabledCount += 1;
    else activeLines.push(line);
  }
  return { activeLines, todoCount, disabledCount };
}

async function inspectTestFile(workspacePath, testPath) {
  if (!isAllowlistedTestPath(testPath)) {
    return { exists: false, activeCount: 0, todoCount: 0, disabledCount: 0, firstActiveLine: null };
  }
  const { absolutePath } = resolveWorkspacePath(workspacePath, testPath, "test");
  try {
    const resolved = await realpath(absolutePath);
    const testRoot = await realpath(path.join(workspacePath, "test"));
    if (!contained(testRoot, resolved) || !(await stat(resolved)).isFile()) {
      return { exists: false, activeCount: 0, todoCount: 0, disabledCount: 0, firstActiveLine: null };
    }
    const { activeLines, todoCount, disabledCount } = scanTestDeclarations(await readFile(resolved, "utf8"));
    return {
      exists: true,
      activeCount: activeLines.length,
      todoCount,
      disabledCount,
      firstActiveLine: activeLines[0] ?? null,
    };
  } catch {
    return { exists: false, activeCount: 0, todoCount: 0, disabledCount: 0, firstActiveLine: null };
  }
}

function affectedRules(changes) {
  const groups = new Map();
  for (const change of changes) {
    const matches = [...new Map(
      [change.path, change.originalPath]
        .filter(Boolean)
        .flatMap((filePath) => rulesForPath(filePath))
        .map((rule) => [rule.id, rule]),
    ).values()];
    const rules = matches.length ? matches : [{
      id: "unmapped",
      label: "Unmapped repository area",
      journey: "Unknown until a human reviews the changed area",
      tags: [],
      impact: "unknown",
      tests: [],
      manual: [],
    }];
    for (const rule of rules) {
      if (!groups.has(rule.id)) groups.set(rule.id, { rule, changes: [] });
      groups.get(rule.id).changes.push(change);
    }
  }
  return [...groups.values()];
}

async function testEvidenceByRule(workspacePath, groups) {
  const testPaths = [...new Set(groups.flatMap(({ rule }) => rule.tests))];
  const entries = await Promise.all(testPaths.map(async (testPath) => [
    testPath,
    await inspectTestFile(workspacePath, testPath),
  ]));
  return new Map(entries);
}

function changedLineCount(changes) {
  const known = changes.filter((change) => Number.isInteger(change.added) && Number.isInteger(change.deleted));
  if (!known.length) return null;
  return known.reduce((total, change) => total + change.added + change.deleted, 0);
}

function levelFromScore(score) {
  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  if (score >= 1) return "low";
  return "unknown";
}

function riskForGroup(group, testEvidence, allChanges) {
  const { rule, changes } = group;
  const factors = [];
  const tags = new Set(rule.tags);
  const add = (id, label, weight, evidence) => factors.push({ id, label, weight, evidence });
  if (tags.has("runtime")) add("runtime-code", "Runtime code changed", 2, changes.map((item) => item.path));
  if (tags.has("persistence")) add("persistence-state", "Persistence behavior changed", 2, changes.map((item) => item.path));
  if (tags.has("ui")) add("user-interface", "User interface changed", 1, changes.map((item) => item.path));
  if (tags.has("workflow")) add("workflow-script", "Workflow or script changed", 2, changes.map((item) => item.path));
  const lines = changedLineCount(changes);
  if (lines !== null && lines > 150) add("large-change", "More than 150 changed lines", 2, [`${lines} changed lines`]);
  else if (lines !== null && lines > 50) add("medium-change", "More than 50 changed lines", 1, [`${lines} changed lines`]);
  const hasActiveTest = rule.tests.some((testPath) => (testEvidence.get(testPath)?.activeCount ?? 0) > 0);
  if ((tags.has("runtime") || tags.has("workflow")) && !hasActiveTest && !tags.has("artifact")) {
    add("missing-nearby-tests", "No active mapped test was found", 2, rule.tests.length ? rule.tests : ["No mapped tests"]);
  }
  const implementationChanged = allChanges.some((item) => !item.path.startsWith("test/"));
  const testsChanged = changes.some((item) => item.path.startsWith("test/"));
  if (testsChanged && !implementationChanged) {
    add("tests-without-implementation", "Tests changed without mapped implementation", 1, changes.map((item) => item.path));
  }
  const score = factors.reduce((total, factor) => total + factor.weight, 0);
  return {
    id: `risk-${rule.id}`,
    kind: "inferred",
    title: `${rule.label} regression risk`,
    rationale: `Changed paths map to ${rule.label}; the impact on “${rule.journey}” is a deterministic inference, not proof of a defect.`,
    capability: rule.label,
    journey: rule.journey,
    likelihood: levelFromScore(score),
    impact: LEVELS.has(rule.impact) ? rule.impact : "unknown",
    score,
    factors,
    mitigations: hasActiveTest
      ? ["Run the mapped active tests.", "Review changed behavior at the cited paths and lines."]
      : ["Add or identify targeted coverage.", "Perform a focused human review before release."],
    evidence: changes.flatMap(evidenceForChange),
    linkedTestIds: [],
  };
}

function recommendationId(testPath) {
  return `test-${createHash("sha256").update(testPath).digest("hex").slice(0, 12)}`;
}

function targetedRecommendation(testPath, evidence, riskIds) {
  const definition = TEST_DEFINITIONS[testPath];
  const recommendation = {
    id: recommendationId(testPath),
    title: definition.title,
    category: definition.category,
    mode: "automated",
    source: "existing",
    rationale: `This active repository test is mapped to the changed capability; TODO declarations are counted separately and are not treated as coverage.`,
    linkedRiskIds: riskIds,
    evidence: [{
      path: testPath,
      line: evidence.firstActiveLine,
      activeTests: evidence.activeCount,
      todoTests: evidence.todoCount,
      disabledTests: evidence.disabledCount,
    }],
    commandId: "targeted-node-test",
    testPath,
    selectable: true,
  };
  recommendation.exactCommand = safeCommandFor(recommendation).display;
  return recommendation;
}

function commandRecommendation(commandId, title, category, rationale, riskIds, evidence) {
  const recommendation = {
    id: commandId,
    title,
    category,
    mode: "automated",
    source: "existing",
    rationale,
    linkedRiskIds: riskIds,
    evidence,
    commandId,
    testPath: null,
    selectable: true,
  };
  recommendation.exactCommand = safeCommandFor(recommendation).display;
  return recommendation;
}

async function buildRecommendations(workspacePath, groups, risks, testEvidence) {
  const recommendations = new Map();
  for (const { rule } of groups) {
    const riskId = `risk-${rule.id}`;
    for (const testPath of rule.tests) {
      const evidence = testEvidence.get(testPath);
      if (evidence?.exists && evidence.activeCount > 0) {
        const id = recommendationId(testPath);
        const current = recommendations.get(id);
        if (current) {
          if (!current.linkedRiskIds.includes(riskId)) current.linkedRiskIds.push(riskId);
        } else {
          recommendations.set(id, targetedRecommendation(testPath, evidence, [riskId]));
        }
      }
    }
    for (const manual of rule.manual) {
      const id = `manual-${rule.id}-${manual.id}`;
      recommendations.set(id, {
        id,
        title: manual.title,
        category: manual.category,
        mode: "manual",
        source: "proposed",
        rationale: manual.rationale,
        linkedRiskIds: [riskId],
        evidence: risks.find((risk) => risk.id === riskId)?.evidence ?? [],
        commandId: null,
        testPath: null,
        exactCommand: null,
        selectable: false,
      });
    }
    const activeMappedTests = rule.tests.filter((testPath) => (testEvidence.get(testPath)?.activeCount ?? 0) > 0);
    if ((rule.tags.includes("runtime") || rule.tags.includes("workflow")) && !activeMappedTests.length && !rule.tags.includes("artifact")) {
      recommendations.set(`proposed-${rule.id}`, {
        id: `proposed-${rule.id}`,
        title: `Add targeted ${rule.label} coverage`,
        category: "integration",
        mode: "proposed",
        source: "proposed",
        rationale: "No active mapped test was found. This is a coverage proposal, not an executable existing test.",
        linkedRiskIds: [riskId],
        evidence: risks.find((risk) => risk.id === riskId)?.evidence ?? [],
        commandId: null,
        testPath: null,
        exactCommand: null,
        selectable: false,
      });
    }
  }
  const allRiskIds = risks.filter((risk) => risk.kind === "inferred").map((risk) => risk.id);
  const allTags = new Set(groups.flatMap(({ rule }) => rule.tags));
  if ([...allTags].some((tag) => ["runtime", "test", "ui", "state", "data"].includes(tag))) {
    recommendations.set("npm-test", commandRecommendation(
      "npm-test",
      "Full repository test suite",
      "integration",
      "Run the repository's existing Node test suite after targeted checks.",
      allRiskIds,
      [{ path: "package.json", line: 9 }],
    ));
  }
  if ([...allTags].some((tag) => ["workflow", "artifact"].includes(tag))) {
    recommendations.set("npm-validate", commandRecommendation(
      "npm-validate",
      "Repository artifact validation",
      "integration",
      "Validate required local artifacts, links, provenance, and workflow safety rules.",
      allRiskIds,
      [{ path: "package.json", line: 11 }],
    ));
  }
  return [...recommendations.values()];
}

function observation(change) {
  return {
    id: `change-${createHash("sha256").update(`${change.path}:${change.changeType}`).digest("hex").slice(0, 12)}`,
    kind: "observed",
    title: `${change.changeType}: ${change.path}`,
    rationale: "Observed directly from local Git status and diff output.",
    affectedPaths: [change.path, ...(change.originalPath ? [change.originalPath] : [])],
    likelihood: "unknown",
    impact: "unknown",
    factors: [],
    mitigations: [],
    evidence: evidenceForChange(change),
  };
}

export async function analyzeWorkspace(workspacePath, options = {}) {
  const repositoryRoot = await resolveRepository(workspacePath);
  const baseRef = validateBaseRef(options.baseRef);
  const focusPaths = validateFocusPaths(repositoryRoot, options.focusPaths);
  const baseRefCommit = await resolveBaseCommit(repositoryRoot, baseRef);
  const baseCommit = await resolveComparisonBase(repositoryRoot, baseRefCommit, baseRef);
  const [statusRaw, nameStatusRaw, numstatRaw, patchRaw] = await Promise.all([
    runGit(repositoryRoot, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]),
    runGit(repositoryRoot, ["diff", "--no-ext-diff", "--no-color", "--find-renames", "--name-status", "-z", baseCommit, "--"]),
    runGit(repositoryRoot, ["diff", "--no-ext-diff", "--no-color", "--find-renames", "--numstat", "-z", baseCommit, "--"]),
    runGit(repositoryRoot, ["diff", "--no-ext-diff", "--no-color", "--find-renames", "--unified=0", baseCommit, "--"]),
  ]);
  const allChanges = mergeChangeEvidence(
    parsePorcelainZ(statusRaw),
    parseNameStatusZ(nameStatusRaw),
    parseNumstatZ(numstatRaw),
    parseUnifiedDiffHunks(patchRaw),
  );
  const changes = allChanges.filter((change) => focusMatch(change, focusPaths));
  const allWorkingHashes = await Promise.all(allChanges.map((change) => hashWorkingPath(repositoryRoot, change)));
  const groups = affectedRules(changes);
  const testEvidence = await testEvidenceByRule(repositoryRoot, groups);
  const inferredRisks = groups.map((group) => riskForGroup(group, testEvidence, changes));
  const recommendations = await buildRecommendations(repositoryRoot, groups, inferredRisks, testEvidence);
  const automatedRecommendations = recommendations
    .filter((item) => item.mode === "automated" && item.source === "existing");
  const executableEvidencePaths = new Set(automatedRecommendations
    .map((item) => item.testPath ?? "package.json"));
  if (automatedRecommendations.some((item) => item.commandId === "npm-test")) {
    for (const testPath of Object.keys(TEST_DEFINITIONS)) executableEvidencePaths.add(testPath);
  }
  const executableEvidenceHashes = await Promise.all(
    [...executableEvidencePaths].sort().map(async (filePath) => ({
      path: filePath,
      hash: await hashRepositoryPath(repositoryRoot, filePath),
    })),
  );
  const fingerprint = createHash("sha256").update(JSON.stringify({
    schemaVersion: "1.0.0",
    baseRef: baseRef ?? "HEAD",
    baseRefCommit,
    baseCommit,
    focusPaths,
    repositoryChanges: allChanges.map((change, index) => ({
      path: change.path,
      originalPath: change.originalPath,
      changeType: change.changeType,
      staged: change.staged,
      unstaged: change.unstaged,
      untracked: change.untracked,
      added: change.added,
      deleted: change.deleted,
      binary: change.binary,
      hunks: change.hunks,
      workingHash: allWorkingHashes[index],
    })),
    focusedChanges: changes.map((change) => ({ path: change.path, originalPath: change.originalPath })),
    executableEvidence: executableEvidenceHashes,
    recommendations: recommendations.map((item) => ({
      id: item.id,
      mode: item.mode,
      source: item.source,
      commandId: item.commandId,
      testPath: item.testPath,
      evidence: item.evidence,
    })),
  })).digest("hex");
  for (const risk of inferredRisks) {
    risk.linkedTestIds = recommendations
      .filter((item) => item.linkedRiskIds.includes(risk.id))
      .map((item) => item.id);
  }
  const decisions = changes.length ? [{
    id: "decision-release-readiness",
    kind: "human-decision",
    title: "Human release-readiness decision",
    rationale: "Automated and manual results inform readiness but do not authorize release or prove production safety.",
    capability: "Repository change",
    journey: "Decide whether the current local change has sufficient QA evidence",
    likelihood: "unknown",
    impact: "unknown",
    score: null,
    factors: [],
    mitigations: ["Review failed, blocked, skipped, and not-run evidence.", "Record unresolved assumptions before approval."],
    evidence: changes.flatMap(evidenceForChange),
    linkedTestIds: recommendations.map((item) => item.id),
  }] : [];
  return {
    schemaVersion: "1.0.0",
    provenance: {
      label: PROVENANCE_LABEL,
      limitation: "This local deterministic assessment is QA decision support, not proof of product quality or production readiness.",
    },
    baseRef: baseRef ?? "HEAD",
    baseRefCommit,
    baseCommit,
    fingerprint,
    focusPaths,
    totalChangeCount: allChanges.length,
    focusedChangeCount: changes.length,
    clean: allChanges.length === 0,
    changes,
    observations: changes.map(observation),
    risks: [...inferredRisks, ...decisions],
    recommendations,
    assumptions: [
      "Path-to-capability mappings are deterministic repository heuristics and remain inferences.",
      "Existing active tests provide bounded regression evidence; TODO tests are not implemented coverage.",
    ],
    unknowns: [
      "Browser-rendered behavior is unknown until the relevant manual checks are completed.",
      "Changes outside mapped repository areas require human capability and impact classification.",
    ],
  };
}

export function mergeResults(recommendations, existing = {}) {
  const results = {};
  for (const item of recommendations) {
    const prior = existing[item.id];
    results[item.id] = prior && RESULT_STATUSES.has(prior.status)
      ? { ...prior }
      : { status: "not-run", note: "", updatedAt: null, exitCode: null, durationMs: null };
  }
  return results;
}

export function reconcileAssessmentState({
  assessment,
  manualCases = [],
  existingResults = {},
  existingRiskReviews = {},
  previousFingerprint = null,
  now = new Date(),
}) {
  const hasRecordedEvidence = Object.values(existingResults).some((result) =>
    result && RESULT_STATUSES.has(result.status) && result.status !== "not-run");
  const evidenceChanged = previousFingerprint
    ? previousFingerprint !== assessment.fingerprint
    : hasRecordedEvidence;
  const items = [...assessment.recommendations, ...manualCases];
  const results = mergeResults(items, evidenceChanged ? {} : existingResults);
  if (evidenceChanged) {
    for (const result of Object.values(results)) {
      result.note = "Previous result invalidated because the analyzed local Git evidence changed.";
      result.updatedAt = now.toISOString();
    }
  }
  const riskIds = new Set(assessment.risks.filter((risk) => risk.kind === "inferred").map((risk) => risk.id));
  const riskReviews = evidenceChanged
    ? {}
    : Object.fromEntries(Object.entries(existingRiskReviews).filter(([riskId]) => riskIds.has(riskId)));
  return { evidenceChanged, results, riskReviews };
}

function cleanText(value, field, maximum) {
  if (typeof value !== "string") throw new QAError("input_invalid", `${field} must be a string.`);
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maximum) {
    throw new QAError("input_invalid", `${field} must contain 1-${maximum} characters.`);
  }
  return cleaned;
}

export function createManualCase(input, id) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new QAError("manual_case_invalid", "Manual case input must be an object.");
  }
  const allowedKeys = new Set(["title", "category", "rationale", "linkedRiskIds", "id"]);
  const unsupported = Object.keys(input).find((key) => !allowedKeys.has(key));
  if (unsupported) throw new QAError("manual_case_invalid", `Unsupported manual case field: ${unsupported}`);
  if (typeof id !== "string" || !/^manual-user-[A-Za-z0-9-]{1,64}$/.test(id)) {
    throw new QAError("manual_case_invalid", "Manual case ID has an invalid format.");
  }
  const title = cleanText(input.title, "title", 120);
  const rationale = cleanText(input.rationale, "rationale", 500);
  if (!MANUAL_CATEGORIES.has(input.category)) {
    throw new QAError("manual_case_invalid", "Manual category must be unit, integration, accessibility, or exploratory.");
  }
  return {
    id,
    title,
    category: input.category,
    mode: "manual",
    source: "user-added",
    rationale,
    linkedRiskIds: Array.isArray(input.linkedRiskIds) ? input.linkedRiskIds.filter((value) => typeof value === "string").slice(0, 20) : [],
    evidence: [],
    commandId: null,
    testPath: null,
    exactCommand: null,
    selectable: false,
  };
}

export function recordManualResult(record, itemId, status, note, now = new Date()) {
  if (!RESULT_STATUSES.has(status)) {
    throw new QAError("result_status_invalid", "Status must be pass, fail, blocked, skipped, or not-run.");
  }
  const item = record.assessment.recommendations.concat(record.manualCases ?? []).find((candidate) => candidate.id === itemId);
  if (!item) throw new QAError("test_item_not_found", `Unknown test-plan item: ${itemId}`);
  if (item.mode !== "manual") {
    throw new QAError("manual_result_invalid", "Manual results can only be recorded for manual test-plan items.");
  }
  if (note !== undefined && typeof note !== "string") {
    throw new QAError("manual_result_invalid", "Manual result note must be a string.");
  }
  const cleanNote = note?.trim() ?? "";
  if (cleanNote.length > 2000) throw new QAError("manual_result_invalid", "Manual result note must not exceed 2,000 characters.");
  record.results[itemId] = {
    status,
    note: cleanNote,
    updatedAt: now.toISOString(),
    exitCode: null,
    durationMs: null,
  };
  return record.results[itemId];
}

export function recordRiskReview(record, riskId, status) {
  if (!REVIEW_STATUSES.has(status)) {
    throw new QAError("risk_review_invalid", "Risk review must be unreviewed, accepted, or questioned.");
  }
  const risk = record.assessment.risks.find((candidate) => candidate.id === riskId && candidate.kind === "inferred");
  if (!risk) throw new QAError("risk_not_found", `Unknown inferred risk: ${riskId}`);
  record.riskReviews[riskId] = status;
  return { riskId, status };
}

export function planItems(record) {
  return [...record.assessment.recommendations, ...(record.manualCases ?? [])];
}

export function releaseReadiness(record) {
  const items = planItems(record);
  const statuses = items.map((item) => record.results[item.id]?.status ?? "not-run");
  if (!items.length) return { level: "unknown", label: "No test evidence planned" };
  if (statuses.includes("fail")) return { level: "blocked", label: "Not ready: failing evidence" };
  if (statuses.includes("blocked")) return { level: "blocked", label: "Not ready: blocked evidence" };
  if (statuses.includes("not-run")) return { level: "review", label: "Review needed: planned evidence remains" };
  if (statuses.includes("skipped")) return { level: "review", label: "Review needed: skipped evidence remains" };
  return { level: "human-decision", label: "Evidence complete: human sign-off required" };
}

export function reportedIncompleteTests(output) {
  const clean = stripAnsi(output);
  const count = (label, marker) => {
    let summaryCount = null;
    const summaryPattern = new RegExp(`^\\s*(?:#\\s*)?${label}\\s+(\\d+)\\s*$`, "gim");
    for (const match of clean.matchAll(summaryPattern)) {
      summaryCount = Number.parseInt(match[1], 10);
    }
    if (summaryCount !== null) return summaryCount;
    return [...clean.matchAll(new RegExp(`#\\s*${marker}\\b`, "gi"))].length;
  };
  const skipped = count("skipped", "skip");
  const todo = count("todo", "todo");
  return {
    skipped,
    todo,
    total: skipped + todo,
  };
}

function resultCounts(record) {
  const counts = { pass: 0, fail: 0, blocked: 0, skipped: 0, "not-run": 0 };
  for (const item of planItems(record)) counts[record.results[item.id]?.status ?? "not-run"] += 1;
  return counts;
}

function evidenceText(evidence) {
  if (!evidence?.path) return "unknown";
  if (!evidence.line) return evidence.path;
  return `${evidence.path}:${evidence.line}${evidence.endLine ? `-${evidence.endLine}` : ""}`;
}

export function buildSummary(record) {
  const items = planItems(record);
  const readiness = releaseReadiness(record);
  const counts = resultCounts(record);
  const json = {
    schemaVersion: "1.0.0",
    provenance: record.assessment.provenance,
    analysisId: record.id,
    baseRef: record.assessment.baseRef,
    baseCommit: record.assessment.baseCommit,
    focusPaths: record.assessment.focusPaths,
    totalChangeCount: record.assessment.totalChangeCount,
    focusedChangeCount: record.assessment.focusedChangeCount,
    clean: record.assessment.clean,
    readiness,
    changes: record.assessment.changes,
    risks: record.assessment.risks.map((risk) => ({
      ...risk,
      review: risk.kind === "inferred" ? record.riskReviews[risk.id] ?? "unreviewed" : "open",
    })),
    tests: items.map((item) => ({ ...item, result: record.results[item.id] ?? { status: "not-run" } })),
    resultCounts: counts,
    assumptions: record.assessment.assumptions,
    unknowns: record.assessment.unknowns,
  };
  const lines = [
    "# QA Change-Risk summary",
    "",
    `> **${record.assessment.provenance.label}** — ${record.assessment.provenance.limitation}`,
    "",
    `- Analysis: \`${record.id}\``,
    `- Local base: \`${record.assessment.baseRef}\` (\`${record.assessment.baseCommit.slice(0, 12)}\`)`,
    `- Readiness: **${readiness.label}**`,
    `- Results: ${counts.pass} pass, ${counts.fail} fail, ${counts.blocked} blocked, ${counts.skipped} skipped, ${counts["not-run"]} not run`,
    "",
    "## Changes",
    "",
    ...(record.assessment.changes.length
      ? record.assessment.changes.map((change) => `- **${change.changeType}** \`${change.path}\` (${change.added ?? "?"} added, ${change.deleted ?? "?"} deleted)`)
      : record.assessment.clean
        ? ["- Clean working tree; no local changes were observed."]
        : [`- No local changes matched the selected focus paths (${record.assessment.focusedChangeCount} of ${record.assessment.totalChangeCount} shown).`]),
    "",
    "## Risks and decisions",
    "",
    ...record.assessment.risks.map((risk) => {
      const review = risk.kind === "inferred" ? record.riskReviews[risk.id] ?? "unreviewed" : "open";
      return `- **${risk.title}** — ${risk.kind}; likelihood ${risk.likelihood}; impact ${risk.impact}; review ${review}. Evidence: ${risk.evidence.map(evidenceText).join(", ") || "unknown"}`;
    }),
    "",
    "## Test plan and results",
    "",
    ...items.map((item) => {
      const result = record.results[item.id] ?? { status: "not-run", note: "" };
      return `- **${item.title}** — ${item.source} ${item.mode}; **${result.status}**${result.note ? `; ${result.note}` : ""}${item.exactCommand ? `; \`${item.exactCommand}\`` : ""}`;
    }),
    "",
    "## Assumptions",
    "",
    ...record.assessment.assumptions.map((item) => `- ${item}`),
    "",
    "## Unknowns",
    "",
    ...record.assessment.unknowns.map((item) => `- ${item}`),
    "",
    "## Unresolved human decision",
    "",
    "- Decide whether the recorded evidence is sufficient. This export does not authorize release or any remote write.",
  ];
  return { markdown: lines.join("\n"), json };
}

function runProgram(executable, args) {
  return new Promise((resolve, reject) => {
    execFile(executable, args, {
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new QAError("command_resolution_failed", stripAnsi(stderr || error.message).trim() || `Unable to resolve ${executable}.`));
        return;
      }
      resolve(stdout);
    });
  });
}

async function resolveWindowsNpmCommand(command) {
  let wrappers;
  try {
    wrappers = String(await runProgram("where.exe", ["npm.cmd"])).split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  } catch {
    throw new QAError("npm_unavailable", "npm.cmd was not found on PATH.");
  }
  for (const wrapper of wrappers) {
    const directory = path.dirname(wrapper);
    const npmCliPath = path.join(directory, "node_modules", "npm", "bin", "npm-cli.js");
    const nodePath = path.join(directory, "node.exe");
    try {
      const [npmCliStat, nodeStat] = await Promise.all([stat(npmCliPath), stat(nodePath)]);
      if (npmCliStat.isFile() && nodeStat.isFile()) {
        return {
          ...command,
          executable: nodePath,
          args: [npmCliPath, ...command.args],
          resolvedLauncher: "npm.cmd-compatible npm CLI",
        };
      }
    } catch {
      // Try the next fixed npm.cmd location returned by Windows.
    }
  }
  throw new QAError("npm_unavailable", "npm.cmd was found, but its adjacent Node/npm CLI files are unavailable.");
}

export async function validateSafeRecommendation(workspacePath, recommendation, platform = process.platform) {
  if (!recommendation || recommendation.mode !== "automated" || recommendation.source !== "existing" || !recommendation.selectable) {
    throw new QAError("test_not_runnable", "Only existing allowlisted automated tests can run.");
  }
  const command = safeCommandFor(recommendation, platform);
  if (recommendation.commandId === "targeted-node-test") {
    if (!isAllowlistedTestPath(recommendation.testPath)) {
      throw new QAError("test_not_allowlisted", "Targeted test path is not allowlisted.");
    }
    const candidate = resolveWorkspacePath(workspacePath, recommendation.testPath, "test");
    try {
      const [resolvedFile, resolvedTestRoot] = await Promise.all([
        realpath(candidate.absolutePath),
        realpath(path.join(workspacePath, "test")),
      ]);
      if (!contained(resolvedTestRoot, resolvedFile) || !(await stat(resolvedFile)).isFile()) {
        throw new Error("not a contained file");
      }
    } catch {
      throw new QAError("test_path_invalid", `Allowlisted test is missing or escapes the test directory: ${recommendation.testPath}`);
    }
  }
  return platform === "win32" && ["npm-test", "npm-validate"].includes(recommendation.commandId)
    ? resolveWindowsNpmCommand(command)
    : command;
}

export function assertResultModel(record) {
  for (const [id, result] of Object.entries(record.results ?? {})) {
    if (!RESULT_STATUSES.has(result.status)) throw new QAError("state_invalid", `Invalid persisted result status for ${id}.`);
  }
  for (const [id, status] of Object.entries(record.riskReviews ?? {})) {
    if (!REVIEW_STATUSES.has(status)) throw new QAError("state_invalid", `Invalid persisted risk review for ${id}.`);
  }
  return record;
}

export function configuredRules() {
  return CAPABILITY_RULES;
}
