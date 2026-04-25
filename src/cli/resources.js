import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACCEPTANCE_INVARIANTS,
  ACTION_TYPES,
  BLOCK_TYPES,
  ELEMENT_TYPES,
  GAP_VALUES,
  ITEM_TYPES,
  LAYOUT_CONTROL_VALUES,
  PACKAGE_MANIFEST,
  PACKAGE_ROLES,
  REGION_TYPES,
  SCREEN_KINDS,
  STATE_TYPES,
  TOKEN_CONTROL_VALUES
} from "../contracts.js";
import { getPackageStatus as getCompilerPackageStatus } from "../compiler.js";
import { loadPackageInput, loadPackageSource } from "../package-source.js";
import { parseSpec } from "../parser.js";
import { HTML_ADAPTER_REGISTRY } from "../render-html.js";
import { validateSource } from "../validation.js";
import { loadSpecUiConfig } from "./config.js";
import {
  listBuiltInExamples,
  resolvePrototypeInput
} from "./input.js";

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const CONFIG_DIR = ".spec-ui";

export const ROLE_ORDER = [
  "screens",
  "flows",
  "content",
  "layout",
  "tokens",
  "acceptance"
].filter((role) => PACKAGE_ROLES.has(role));

export function createCliError(command, code, message, fields = {}) {
  const error = new Error(message);
  error.cli = true;
  error.command = command;
  error.exitCode = fields.exitCode ?? (code === "unsupported_role" || code === "ambiguous_input" ? 2 : 1);
  error.errors = [
    {
      code,
      message,
      ...Object.fromEntries(
        Object.entries(fields).filter(([key]) => key !== "exitCode")
      )
    }
  ];
  return error;
}

export function normalizeCliError(error, command) {
  if (error?.cli && Array.isArray(error.errors)) {
    return {
      command: error.command ?? command,
      ok: false,
      errors: error.errors
    };
  }

  return {
    command,
    ok: false,
    errors: [
      {
        code: error?.code ?? "runtime_error",
        message: error?.message ?? "Command failed."
      }
    ]
  };
}

export function cliExitCode(error, fallback = 1) {
  return Number.isInteger(error?.exitCode) ? error.exitCode : fallback;
}

export async function listExamples() {
  const examples = await listBuiltInExamples(repoRoot);
  return examples
    .map((example) => ({
      ...example,
      path: toDisplayPath(example.path)
    }))
    .sort(compareByName);
}

export async function listAdapters() {
  return Object.values(HTML_ADAPTER_REGISTRY)
    .map(normalizeAdapter)
    .sort(compareByTarget);
}

export async function listConfiguredPackages({ cwd = process.cwd(), command = "list" } = {}) {
  const config = await loadConfig({ cwd, command });
  if (!config.found) return [];

  const prototypesDir = resolveConfiguredDir(config, "prototypesDir", "prototypes", command);
  if (!await exists(prototypesDir)) return [];

  const entries = await readdir(prototypesDir, { withFileTypes: true });
  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const packageRoot = path.join(prototypesDir, entry.name);
    const manifestPath = path.join(packageRoot, PACKAGE_MANIFEST);
    if (!await exists(manifestPath)) continue;
    packages.push({
      name: entry.name,
      sourceMode: "package",
      path: toDisplayPath(packageRoot, cwd),
      manifestPath: toDisplayPath(manifestPath, cwd)
    });
  }

  return packages.sort(compareByName);
}

export async function createListResult({ filter = "default", cwd = process.cwd(), command = "list" } = {}) {
  const result = {
    command,
    ok: true,
    examples: [],
    packages: [],
    adapters: []
  };

  if (filter === "default" || filter === "examples") {
    result.examples = await listExamples();
  }
  if (filter === "default" || filter === "packages") {
    result.packages = await listConfiguredPackages({ cwd, command });
  }
  if (filter === "adapters") {
    result.adapters = await listAdapters();
  }

  return result;
}

export async function resolveInput(input, { cwd = process.cwd(), command = "show" } = {}) {
  try {
    const resolved = await resolvePrototypeInput(input, {
      cwd,
      repoRoot: cwd
    });

    if (resolved.sourceMode === "package") {
      return packageInput(resolved.path, cwd, resolved.source);
    }

    return {
      sourceMode: "single-file",
      inputPath: resolved.path,
      displayPath: toDisplayPath(resolved.path, cwd),
      source: resolved.source
    };
  } catch (error) {
    const firstError = error?.error ?? error;
    throw createCliError(
      command,
      firstError?.code ?? "input_not_found",
      firstError?.message ?? `Input "${input}" was not found.`,
      {
        ...(firstError?.candidates ? { candidates: firstError.candidates } : {}),
        ...(firstError?.path ? { path: firstError.path } : {}),
        exitCode: firstError?.code === "ambiguous_input" || firstError?.code === "missing_input" ? 2 : 1
      }
    );
  }
}

export async function inspectInput(input, { cwd = process.cwd(), command = "show" } = {}) {
  const resolved = typeof input === "string"
    ? await resolveInput(input, { cwd, command })
    : input;

  if (resolved.sourceMode === "package") {
    return inspectPackage(resolved, cwd);
  }

  const markdown = await readFile(resolved.inputPath, "utf8");
  const source = parseSpec(markdown, {
    sourceFile: toDisplayPath(resolved.inputPath, cwd)
  });
  const errors = validateSource(source);
  const adapterTarget = source.adapter ?? "baseline";

  return {
    command,
    ok: errors.length === 0,
    input: {
      path: toDisplayPath(resolved.inputPath, cwd),
      sourceMode: "single-file",
      source: resolved.source
    },
    sourceMode: "single-file",
    title: source.title,
    surface: source.surface ?? source.attrs?.surface ?? null,
    adapter: normalizeAdapter(HTML_ADAPTER_REGISTRY[adapterTarget] ?? {
      target: adapterTarget,
      resolvedTarget: adapterTarget
    }),
    fidelity: null,
    target: null,
    manifestPath: null,
    includes: [],
    roles: [],
    acceptance: {
      invariantCount: 0,
      noteCount: 0
    },
    readiness: errors.length === 0 ? "ready" : "invalid",
    errors,
    warnings: []
  };
}

export async function loadLocalInstructions({ cwd = process.cwd(), command = "instructions" } = {}) {
  const config = await loadConfig({ cwd, command });
  if (!config.found) return null;

  const instructionsPath = path.join(config.repoRoot, CONFIG_DIR, "instructions.md");
  if (!await exists(instructionsPath)) return null;

  return {
    path: toDisplayPath(instructionsPath, cwd),
    content: await readFile(instructionsPath, "utf8")
  };
}

export async function loadConfig({ cwd = process.cwd(), command = "list" } = {}) {
  const result = loadSpecUiConfig({ cwd });
  if (!result.ok) {
    const firstError = result.errors[0] ?? {
      code: "unsupported_config",
      message: "Invalid Spec UI config."
    };
    throw createCliError(command, firstError.code, firstError.message, {
      ...(firstError.path ? { path: toDisplayPath(firstError.path, cwd) } : {})
    });
  }

  return result;
}

export function supportedInstructionMetadata() {
  return {
    roles: [...ROLE_ORDER],
    controls: {
      screens: {
        screenKinds: sorted(SCREEN_KINDS),
        regions: sorted(REGION_TYPES),
        blocks: sorted(BLOCK_TYPES),
        items: sorted(new Set([...ITEM_TYPES, ...ELEMENT_TYPES])),
        states: sorted(STATE_TYPES)
      },
      flows: {
        actions: sorted(ACTION_TYPES)
      },
      layout: {
        gaps: sorted(GAP_VALUES),
        controls: sortedObjectSets(LAYOUT_CONTROL_VALUES)
      },
      tokens: {
        controls: sortedObjectSets(TOKEN_CONTROL_VALUES)
      },
      acceptance: {
        invariants: sorted(ACCEPTANCE_INVARIANTS)
      }
    }
  };
}

export function toDisplayPath(filePath, cwd = process.cwd()) {
  const relativePath = path.relative(cwd, filePath);
  let display;

  if (relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
    display = relativePath;
  } else {
    const repoRelativePath = path.relative(repoRoot, filePath);
    display = repoRelativePath && !repoRelativePath.startsWith("..") && !path.isAbsolute(repoRelativePath)
      ? repoRelativePath
      : path.resolve(filePath);
  }

  return (display || ".").split(path.sep).join("/");
}

function inspectPackage(resolved, cwd) {
  const source = loadPackageSource(resolved.packageRoot ?? resolved.inputPath);
  const status = getCompilerPackageStatus(loadPackageInput(resolved.packageRoot ?? resolved.inputPath));
  const adapterTarget = source.adapter ?? "bootstrap-html";
  const adapter = HTML_ADAPTER_REGISTRY[adapterTarget] ?? {
    target: adapterTarget,
    resolvedTarget: adapterTarget
  };
  const includes = (source.package?.includes ?? [])
    .map((include) => ({
      path: include.path,
      role: include.role,
      required: include.required,
      status: normalizeIncludeStatus(include.parseStatus, include.exists),
      exists: include.exists === true,
      sourceFile: include.sourceFile,
      line: include.line
    }))
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.path.localeCompare(b.path));

  return {
    ok: status.readiness === "ready",
    input: {
      path: toDisplayPath(source.package.root, cwd),
      sourceMode: "package",
      source: resolved.source
    },
    sourceMode: "package",
    title: source.title,
    surface: source.surface ?? source.attrs?.surface ?? null,
    adapter: normalizeAdapter(adapter),
    target: source.target ?? "standalone-html",
    fidelity: source.fidelity ?? "prototype",
    manifestPath: toDisplayPath(source.package.manifestPath, cwd),
    includes,
    roles: includes.map((include) => ({
      role: include.role,
      path: include.path,
      required: include.required,
      status: include.status
    })),
    acceptance: {
      invariantCount: source.acceptance?.invariants?.length ?? 0,
      noteCount: source.acceptance?.notes?.length ?? 0
    },
    readiness: status.readiness,
    errors: status.validationErrors ?? [],
    warnings: []
  };
}

function packageInput(packageRoot, cwd, source) {
  return {
    sourceMode: "package",
    inputPath: packageRoot,
    packageRoot,
    manifestPath: path.join(packageRoot, PACKAGE_MANIFEST),
    displayPath: toDisplayPath(packageRoot, cwd),
    source
  };
}

function normalizeAdapter(adapter) {
  const assetProvenance = normalizeAssetProvenance(adapter.assetProvenance);
  return {
    target: adapter.target,
    version: adapter.version ?? null,
    resolvedTarget: adapter.resolvedTarget ?? adapter.target,
    ...(adapter.resolvedLibrary ? { resolvedLibrary: adapter.resolvedLibrary } : {}),
    ...(assetProvenance ? { assetProvenance } : {})
  };
}

function normalizeAssetProvenance(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  return {
    mode: String(value),
    source: String(value)
  };
}

function normalizeIncludeStatus(parseStatus, exists) {
  if (parseStatus === "parsed") return "resolved";
  if (parseStatus === "skipped") return "skipped";
  if (parseStatus === "invalid") return "invalid";
  if (parseStatus === "blocked") return "blocked";
  if (parseStatus === "missing") return "missing";
  return exists ? "resolved" : "missing";
}

function resolveConfiguredDir(config, key, fallback, command) {
  const value = config.config?.[key] ?? fallback;
  if (typeof value !== "string" || value.trim() === "" || path.isAbsolute(value)) {
    throw createCliError(command, "unsupported_config", `Config field "${key}" must be a repo-relative path.`, {
      path: toDisplayPath(config.configPath)
    });
  }

  const resolved = path.resolve(config.repoRoot, value);
  const relativePath = path.relative(config.repoRoot, resolved);
  if (relativePath === ".." || relativePath.startsWith(`..${path.sep}`)) {
    throw createCliError(command, "unsupported_config", `Config field "${key}" must stay inside the repo.`, {
      path: toDisplayPath(config.configPath)
    });
  }

  return resolved;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function sorted(values) {
  return [...values].map(String).sort();
}

function sortedObjectSets(object) {
  return Object.fromEntries(
    Object.keys(object)
      .sort()
      .map((key) => [key, sorted(object[key])])
  );
}

function compareByName(a, b) {
  return a.name.localeCompare(b.name);
}

function compareByTarget(a, b) {
  return a.target.localeCompare(b.target);
}
