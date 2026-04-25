import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { detectSourceInput, loadPackageInput } from "../package-source.js";
import { usageError } from "./options.js";
import { loadSpecUiConfig } from "./config.js";

const SPEC_UI_REPO_ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

export async function resolvePrototypeInput(input, options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const repoRoot = options.repoRoot ?? cwd;
  const candidate = await resolveInputPath(input, { cwd, repoRoot });
  const detected = detectSourceInput(candidate.path);

  if (!detected.exists) {
    throw inputNotFound(input);
  }

  if (detected.sourceMode === "package") {
    return {
      raw: input,
      path: detected.packageRoot,
      source: candidate.source,
      sourceMode: "package",
      packageInput: loadPackageInput(detected.packageRoot),
      manifestPath: detected.manifestPath
    };
  }

  return {
    raw: input,
    path: detected.inputPath,
    source: candidate.source,
    sourceMode: "single-file",
    markdown: await readFile(detected.inputPath, "utf8")
  };
}

async function resolveInputPath(input, { cwd, repoRoot }) {
  if (!input) throw inputNotFound(input);

  const explicitPath = path.resolve(cwd, input);
  if (isPathLike(input) || existsSync(explicitPath)) {
    return {
      path: explicitPath,
      source: "path"
    };
  }

  const candidates = await discoverNamedCandidates(input, { repoRoot });
  if (candidates.length === 0) throw inputNotFound(input);
  if (candidates.length > 1) {
    throw usageError({
      code: "ambiguous_input",
      message: `Input "${input}" matches more than one prototype source.`,
      candidates
    });
  }

  return candidates[0];
}

async function discoverNamedCandidates(name, { repoRoot }) {
  const candidates = new Map();
  const config = loadSpecUiConfig({ cwd: repoRoot });
  if (!config.ok) {
    throw {
      code: config.errors[0]?.code ?? "unsupported_config",
      message: config.errors[0]?.message ?? "Invalid Spec UI config.",
      path: config.errors[0]?.path
    };
  }

  const configuredPackage = path.resolve(config.repoRoot, config.config.prototypesDir, name);

  if (await isPackageDir(configuredPackage)) {
    candidates.set(configuredPackage, {
      path: configuredPackage,
      source: "configured-package"
    });
  }

  const examplesDir = path.join(SPEC_UI_REPO_ROOT, "examples");
  for (const candidate of [
    path.join(examplesDir, name),
    path.join(examplesDir, `${name}.md`),
    path.join(examplesDir, `${name}-package`)
  ]) {
    if (existsSync(candidate)) {
      candidates.set(candidate, {
        path: candidate,
        source: "built-in-example"
      });
    }
  }

  return [...candidates.values()].sort((a, b) => a.path.localeCompare(b.path));
}

async function isPackageDir(candidate) {
  try {
    const stats = await stat(candidate);
    return stats.isDirectory() && existsSync(path.join(candidate, "prototype.md"));
  } catch {
    return false;
  }
}

export async function listBuiltInExamples(repoRoot = SPEC_UI_REPO_ROOT) {
  const examplesDir = path.resolve(repoRoot, "examples");
  try {
    const entries = await readdir(examplesDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() || entry.name.endsWith(".md"))
      .map((entry) => {
        const fullPath = path.join(examplesDir, entry.name);
        return {
          name: entry.name.replace(/\.md$/, ""),
          path: fullPath,
          sourceMode: entry.isDirectory() ? "package" : "single-file"
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

function isPathLike(input) {
  return input.includes("/") || input.includes("\\") || input === "." || input === "..";
}

function inputNotFound(input) {
  return {
    code: "input_not_found",
    message: input
      ? `Input "${input}" could not be resolved.`
      : "An input path or package name is required."
  };
}
