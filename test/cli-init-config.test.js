import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path, { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

import {
  DEFAULT_CONFIG,
  TEMPLATE_FILE_NAMES
} from "../src/cli/templates.js";
import {
  discoverSpecUiConfig,
  listConfiguredPackages,
  loadSpecUiConfig,
  resolveConfiguredPackageName
} from "../src/cli/config.js";
import { loadPackageSource } from "../src/package-source.js";
import { compilePackageToIr } from "../src/compiler.js";
import { validateSource } from "../src/validation.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const cliPath = join(repoRoot, "bin/spec-ui.mjs");

describe("spec-ui init", () => {
  test("creates deterministic default config, instructions, and templates", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-init-"));

    const result = runCli(["init"], dir);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Spec UI initialized/);

    const configPath = join(dir, ".spec-ui", "config.json");
    assert.deepEqual(JSON.parse(await readFile(configPath, "utf8")), DEFAULT_CONFIG);
    assert.equal(await readFile(configPath, "utf8"), `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`);

    const instructions = await readFile(join(dir, ".spec-ui", "instructions.md"), "utf8");
    assert.match(instructions, /standalone, deterministic, and portable/);
    assert.doesNotMatch(instructions, /microcanvas|viewer/i);
    assert.equal(existsSync(join(dir, "prototypes", "starter")), false);

    for (const fileName of TEMPLATE_FILE_NAMES) {
      const contents = await readFile(join(dir, ".spec-ui", "templates", fileName), "utf8");
      assert.ok(contents.endsWith("\n"), fileName);
      assert.doesNotMatch(contents, /<script|<style|class=|className=|cdn|microcanvas/i, fileName);
    }
  });

  test("initializes an explicit path and reports JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-init-"));
    const target = join(dir, "workspace");

    const result = runCli(["init", target, "--json"], dir);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.command, "init");
    assert.equal(payload.ok, true);
    assert.equal(payload.rootPath, target);
    assert.equal(payload.configPath, join(target, ".spec-ui", "config.json"));
    assert.equal(existsSync(payload.configPath), true);
  });

  test("refuses existing generated files unless force is used", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-init-"));
    assert.equal(runCli(["init"], dir).status, 0);

    const second = runCli(["init", "--json"], dir);
    assert.equal(second.status, 1);
    const failure = JSON.parse(second.stdout);
    assert.equal(failure.ok, false);
    assert.equal(failure.errors[0].code, "init_already_exists");
    assert.ok(failure.skipped.some((filePath) => filePath.endsWith(join(".spec-ui", "config.json"))));

    const unknownFile = join(dir, ".spec-ui", "local-note.md");
    await writeFile(unknownFile, "do not delete\n");
    const forced = runCli(["init", "--force", "--json"], dir);
    assert.equal(forced.status, 0, forced.stderr);
    const payload = JSON.parse(forced.stdout);
    assert.ok(payload.overwritten.some((filePath) => filePath.endsWith(join(".spec-ui", "config.json"))));
    assert.equal(await readFile(unknownFile, "utf8"), "do not delete\n");
  });

  test("refuses an existing template path before partial writes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-init-"));
    await mkdir(join(dir, ".spec-ui", "templates"), { recursive: true });
    await writeFile(join(dir, ".spec-ui", "templates", "layout.md"), "custom\n");

    const result = runCli(["init", "--json"], dir);

    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, false);
    assert.equal(payload.errors[0].code, "init_already_exists");
    assert.equal(existsSync(join(dir, ".spec-ui", "config.json")), false);
    assert.equal(await readFile(join(dir, ".spec-ui", "templates", "layout.md"), "utf8"), "custom\n");
  });

  test("rejects generated directories that are symlinks outside the init root", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-init-"));
    const outside = await mkdtemp(join(tmpdir(), "spec-ui-init-outside-"));
    await symlink(outside, join(dir, ".spec-ui"), "dir");

    const result = runCli(["init", "--json"], dir);

    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, false);
    assert.equal(payload.errors[0].code, "init_path_escape");
    assert.equal(existsSync(join(outside, "config.json")), false);
  });

  test("rejects non-directory generated paths before writing files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-init-"));
    await mkdir(join(dir, ".spec-ui"), { recursive: true });
    await writeFile(join(dir, ".spec-ui", "templates"), "not a directory\n");

    const result = runCli(["init", "--json"], dir);

    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, false);
    assert.equal(payload.errors[0].code, "init_already_exists");
    assert.equal(existsSync(join(dir, ".spec-ui", "config.json")), false);
    assert.equal(await readFile(join(dir, ".spec-ui", "templates"), "utf8"), "not a directory\n");
  });

  test("creates a visible starter package that validates and compiles", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-init-"));

    const result = runCli(["init", "--examples", "--json"], dir);

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.examplesCreated, true);

    const starterDir = join(dir, "prototypes", "starter");
    for (const fileName of TEMPLATE_FILE_NAMES) {
      assert.equal(existsSync(join(starterDir, fileName)), true, fileName);
    }
    assert.equal(existsSync(join(dir, ".spec-ui", "prototypes", "starter")), false);

    const source = loadPackageSource(starterDir);
    assert.deepEqual(validateSource(source), []);

    const ir = compilePackageToIr(packageInputFromDir(starterDir));
    assert.equal(ir.metadata.sourceMode, "package");
    assert.equal(ir.metadata.package.target, "standalone-html");
  });
});

describe("Spec UI config loading", () => {
  test("discovers config upward and falls back to built-in defaults without config", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-config-"));
    const nested = join(dir, "a", "b");
    await mkdir(nested, { recursive: true });

    const noConfig = loadSpecUiConfig({ cwd: nested });
    assert.equal(noConfig.ok, true);
    assert.equal(noConfig.found, false);
    assert.deepEqual(noConfig.config, DEFAULT_CONFIG);

    assert.equal(runCli(["init"], dir).status, 0);
    const discovered = discoverSpecUiConfig(nested);
    assert.equal(discovered.found, true);
    assert.equal(discovered.repoRoot, dir);

    const loaded = loadSpecUiConfig({ cwd: nested });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.found, true);
    assert.equal(loaded.directories.prototypesDir, join(dir, "prototypes"));
  });

  test("rejects malformed, unsupported, absolute, and escaping config values", () => {
    const malformedDir = tempConfig("{");
    assert.equal(loadSpecUiConfig({ cwd: malformedDir }).errors[0].code, "config_malformed");

    for (const config of [
      { ...DEFAULT_CONFIG, defaultAdapter: "unknown" },
      { ...DEFAULT_CONFIG, defaultTarget: "remote-app" },
      { ...DEFAULT_CONFIG, prototypesDir: "/tmp/prototypes" },
      { ...DEFAULT_CONFIG, artifactsDir: "../artifacts" },
      { ...DEFAULT_CONFIG, requiredRoles: ["screens", "mystery"] }
    ]) {
      const dir = tempConfig(`${JSON.stringify(config, null, 2)}\n`);
      const result = loadSpecUiConfig({ cwd: dir });
      assert.equal(result.ok, false);
      assert.equal(result.errors[0].code, "unsupported_config");
    }
  });

  test("rejects configured directories that resolve outside the repo", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-config-"));
    const outside = await mkdtemp(join(tmpdir(), "spec-ui-config-outside-"));
    writeConfig(dir, DEFAULT_CONFIG);
    await symlink(outside, join(dir, "prototypes"), "dir");

    const result = loadSpecUiConfig({ cwd: dir });

    assert.equal(result.ok, false);
    assert.equal(result.errors[0].code, "unsupported_config");
  });

  test("lists and resolves configured package names deterministically", () => {
    const dir = mkdtempSync(join(tmpdir(), "spec-ui-config-"));
    try {
      writeConfig(dir, DEFAULT_CONFIG);
      const alpha = join(dir, "prototypes", "alpha");
      const zeta = join(dir, "prototypes", "zeta");
      mkdirSyncRecursive(alpha);
      mkdirSyncRecursive(zeta);
      writeFileSync(join(alpha, "prototype.md"), "# Prototype: Alpha\n");
      writeFileSync(join(zeta, "prototype.md"), "# Prototype: Zeta\n");

      const config = loadSpecUiConfig({ cwd: dir });
      assert.deepEqual(
        listConfiguredPackages(config).map((item) => item.name),
        ["alpha", "zeta"]
      );
      assert.equal(resolveConfiguredPackageName("alpha", config).packageRoot, alpha);
      assert.equal(resolveConfiguredPackageName("../alpha", config), null);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

function runCli(args, cwd) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8"
  });
}

function tempConfig(contents) {
  const dir = mkdtempSync(join(tmpdir(), "spec-ui-config-"));
  writeFileSync(join(dir, ".keep"), "");
  writeConfig(dir, contents);
  return dir;
}

function writeConfig(dir, configOrContents) {
  mkdirSyncRecursive(join(dir, ".spec-ui"));
  const contents = typeof configOrContents === "string"
    ? configOrContents
    : `${JSON.stringify(configOrContents, null, 2)}\n`;
  writeFileSync(join(dir, ".spec-ui", "config.json"), contents);
}

function mkdirSyncRecursive(dir) {
  mkdirSync(dir, { recursive: true });
}

function packageInputFromDir(packageRoot) {
  const manifestPath = join(packageRoot, "prototype.md");
  return {
    packageRoot,
    manifestPath,
    manifestMarkdown: readFileSync(manifestPath, "utf8"),
    files: TEMPLATE_FILE_NAMES
      .filter((fileName) => fileName !== "prototype.md")
      .map((fileName) => ({
        path: fileName,
        contents: readFileSync(join(packageRoot, fileName), "utf8")
      }))
  };
}
