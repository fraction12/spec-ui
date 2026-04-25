import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

import { PACKAGE_ROLES } from "../contracts.js";
import { HTML_ADAPTER_REGISTRY } from "../render-html.js";
import { DEFAULT_CONFIG } from "./templates.js";

export const CONFIG_DIR = ".spec-ui";
export const CONFIG_FILE = "config.json";
export const SUPPORTED_HANDOFF_TARGETS = new Set(["standalone-html"]);

export function discoverSpecUiConfig(startDir = process.cwd()) {
  let current = path.resolve(startDir);

  while (true) {
    const candidate = path.join(current, CONFIG_DIR, CONFIG_FILE);
    if (existsSync(candidate)) {
      return {
        found: true,
        repoRoot: current,
        configPath: candidate
      };
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return {
        found: false,
        repoRoot: path.resolve(startDir),
        configPath: null
      };
    }
    current = parent;
  }
}

export function loadSpecUiConfig(options = {}) {
  const startDir = options.cwd ?? process.cwd();
  const discovered = options.configPath
    ? {
        found: true,
        repoRoot: options.repoRoot ?? path.dirname(path.dirname(path.resolve(options.configPath))),
        configPath: path.resolve(options.configPath)
      }
    : discoverSpecUiConfig(startDir);

  if (!discovered.found) {
    const repoRoot = path.resolve(startDir);
    return {
      ok: true,
      found: false,
      repoRoot,
      configPath: null,
      config: { ...DEFAULT_CONFIG },
      directories: resolveConfigDirectories(repoRoot, DEFAULT_CONFIG),
      errors: []
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(discovered.configPath, "utf8"));
  } catch (error) {
    return configFailure(discovered, "config_malformed", `Could not parse ${CONFIG_DIR}/${CONFIG_FILE}: ${error.message}`);
  }

  const validation = validateSpecUiConfig(parsed, {
    repoRoot: discovered.repoRoot,
    configPath: discovered.configPath
  });

  if (validation.errors.length > 0) {
    return {
      ok: false,
      found: true,
      repoRoot: discovered.repoRoot,
      configPath: discovered.configPath,
      config: null,
      directories: null,
      errors: validation.errors
    };
  }

  return {
    ok: true,
    found: true,
    repoRoot: discovered.repoRoot,
    configPath: discovered.configPath,
    config: validation.config,
    directories: resolveConfigDirectories(discovered.repoRoot, validation.config),
    errors: []
  };
}

export function validateSpecUiConfig(input, options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const configPath = options.configPath ?? path.join(repoRoot, CONFIG_DIR, CONFIG_FILE);
  const errors = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    errors.push(unsupportedConfig("Config must be a JSON object.", configPath));
    return { ok: false, config: null, errors };
  }

  const config = {
    schemaVersion: input.schemaVersion,
    defaultAdapter: input.defaultAdapter,
    defaultTarget: input.defaultTarget,
    prototypesDir: input.prototypesDir,
    artifactsDir: input.artifactsDir,
    requiredRoles: input.requiredRoles,
    optionalRoles: input.optionalRoles
  };

  if (config.schemaVersion !== 1) {
    errors.push(unsupportedConfig('Config "schemaVersion" must be 1.', configPath));
  }

  if (!Object.hasOwn(HTML_ADAPTER_REGISTRY, config.defaultAdapter)) {
    errors.push(unsupportedConfig(`Unsupported default adapter "${String(config.defaultAdapter)}".`, configPath));
  }

  if (!SUPPORTED_HANDOFF_TARGETS.has(config.defaultTarget)) {
    errors.push(unsupportedConfig(`Unsupported default handoff target "${String(config.defaultTarget)}".`, configPath));
  }

  for (const key of ["prototypesDir", "artifactsDir"]) {
    const safe = validateSafeRelativeDir(config[key], {
      key,
      repoRoot,
      configPath
    });
    if (!safe.ok) errors.push(safe.error);
  }

  for (const key of ["requiredRoles", "optionalRoles"]) {
    const roles = validateRoleList(config[key], key, configPath);
    if (roles.errors.length > 0) errors.push(...roles.errors);
  }

  return {
    ok: errors.length === 0,
    config: errors.length === 0 ? config : null,
    errors
  };
}

export function validateSafeRelativeDir(value, options = {}) {
  const key = options.key ?? "path";
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const configPath = options.configPath;

  if (typeof value !== "string" || value.trim() === "") {
    return {
      ok: false,
      error: unsupportedConfig(`Config "${key}" must be a non-empty relative directory.`, configPath)
    };
  }

  if (path.isAbsolute(value)) {
    return {
      ok: false,
      error: unsupportedConfig(`Config "${key}" must not be an absolute path.`, configPath)
    };
  }

  const normalized = path.normalize(value);
  if (normalized === "." || normalized.startsWith("..") || normalized.includes(`..${path.sep}`)) {
    return {
      ok: false,
      error: unsupportedConfig(`Config "${key}" must stay inside the repo root.`, configPath)
    };
  }

  const absolutePath = path.resolve(repoRoot, normalized);
  const relativeToRoot = path.relative(repoRoot, absolutePath);
  if (relativeToRoot === ".." || relativeToRoot.startsWith(`..${path.sep}`)) {
    return {
      ok: false,
      error: unsupportedConfig(`Config "${key}" must stay inside the repo root.`, configPath)
    };
  }

  if (existsSync(absolutePath)) {
    const realRoot = realpathSync(repoRoot);
    const realPath = realpathSync(absolutePath);
    const realRelative = path.relative(realRoot, realPath);
    if (realRelative === ".." || realRelative.startsWith(`..${path.sep}`) || path.isAbsolute(realRelative)) {
      return {
        ok: false,
        error: unsupportedConfig(`Config "${key}" must resolve inside the repo root.`, configPath)
      };
    }
  }

  return {
    ok: true,
    value: normalized,
    absolutePath
  };
}

export function resolveConfiguredPackageName(name, configResult) {
  if (!configResult?.ok || !configResult.found) {
    return null;
  }

  const safeName = validatePackageName(name);
  if (!safeName.ok) {
    return null;
  }

  const packageRoot = path.join(configResult.directories.prototypesDir, safeName.name);
  const manifestPath = path.join(packageRoot, "prototype.md");

  if (!existsSync(manifestPath)) {
    return null;
  }

  return {
    sourceMode: "package",
    name: safeName.name,
    packageRoot,
    manifestPath
  };
}

export function listConfiguredPackages(configResult) {
  if (!configResult?.ok || !configResult.found) {
    return [];
  }

  const prototypesDir = configResult.directories.prototypesDir;
  if (!existsSync(prototypesDir) || !statSync(prototypesDir).isDirectory()) {
    return [];
  }

  return statSafeDirEntries(prototypesDir)
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(path.join(prototypesDir, name, "prototype.md")))
    .sort()
    .map((name) => ({
      name,
      path: path.join(prototypesDir, name)
    }));
}

function resolveConfigDirectories(repoRoot, config) {
  return {
    prototypesDir: path.resolve(repoRoot, config.prototypesDir),
    artifactsDir: path.resolve(repoRoot, config.artifactsDir)
  };
}

function validateRoleList(value, key, configPath) {
  const errors = [];
  if (!Array.isArray(value) || value.some((role) => typeof role !== "string")) {
    return {
      errors: [unsupportedConfig(`Config "${key}" must be an array of role names.`, configPath)]
    };
  }

  for (const role of value) {
    if (!PACKAGE_ROLES.has(role)) {
      errors.push(unsupportedConfig(`Unsupported package role "${role}" in "${key}".`, configPath));
    }
  }

  return { errors };
}

function validatePackageName(name) {
  if (typeof name !== "string" || name.trim() === "") {
    return { ok: false };
  }

  const normalized = path.normalize(name);
  if (
    path.isAbsolute(name) ||
    normalized === "." ||
    normalized.startsWith("..") ||
    normalized.includes(path.sep)
  ) {
    return { ok: false };
  }

  return { ok: true, name: normalized };
}

function statSafeDirEntries(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function configFailure(discovered, code, message) {
  return {
    ok: false,
    found: true,
    repoRoot: discovered.repoRoot,
    configPath: discovered.configPath,
    config: null,
    directories: null,
    errors: [
      {
        code,
        message,
        path: discovered.configPath
      }
    ]
  };
}

function unsupportedConfig(message, configPath) {
  return {
    code: "unsupported_config",
    message,
    ...(configPath ? { path: configPath } : {})
  };
}
