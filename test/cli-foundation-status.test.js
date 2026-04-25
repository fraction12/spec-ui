import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

import { runCli as runCliInProcess } from "../src/cli/index.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const cliPath = path.join(repoRoot, "bin/spec-ui.mjs");

describe("spec-ui CLI foundation", () => {
  test("prints top-level help and command help aliases", () => {
    const topLevel = runCli(["--help"]);
    assert.equal(topLevel.status, 0, topLevel.stderr);
    assert.match(topLevel.stdout, /Usage: spec-ui/);
    assert.match(topLevel.stdout, /status\s+Check prototype readiness/);
    assert.match(topLevel.stdout, /compile\s+Compile a prototype/);

    const helpAlias = runCli(["help", "status"]);
    const commandHelp = runCli(["status", "--help"]);
    assert.equal(helpAlias.status, 0, helpAlias.stderr);
    assert.equal(commandHelp.status, 0, commandHelp.stderr);
    assert.equal(helpAlias.stdout, commandHelp.stdout);
    assert.match(helpAlias.stdout, /Usage: spec-ui status <input-or-name>/);
  });

  test("prints version from shared metadata", () => {
    const result = runCli(["--version"]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^0\.1\.0\n$/);
  });

  test("reports usage errors with stable exit code", () => {
    const unknownCommand = runCli(["frobnicate"]);
    assert.equal(unknownCommand.status, 2);
    assert.equal(JSON.parse(unknownCommand.stderr).errors[0].code, "unknown_command");

    const unknownOption = runCli(["status", "examples/task-board.md", "--wat"]);
    assert.equal(unknownOption.status, 2);
    assert.equal(JSON.parse(unknownOption.stderr).errors[0].code, "unknown_option");

    const missingInput = runCli(["status"]);
    assert.equal(missingInput.status, 2);
    assert.equal(JSON.parse(missingInput.stderr).errors[0].code, "missing_input");
  });
});

describe("spec-ui status", () => {
  test("reports ready package status in human and JSON modes", async () => {
    const packageDir = await createReadyPackage();

    const human = runCli(["status", packageDir]);
    assert.equal(human.status, 0, human.stderr);
    assert.match(human.stdout, /Prototype: CLI Package/);
    assert.match(human.stdout, /Source: package/);
    assert.match(human.stdout, /Readiness: ready/);
    assert.match(human.stdout, /Includes: 6\/6 resolved/);

    const json = runCli(["status", packageDir, "--json"]);
    assert.equal(json.status, 0, json.stderr);
    assert.equal(json.stderr, "");
    const status = JSON.parse(json.stdout);
    assert.equal(status.command, "status");
    assert.equal(status.ok, true);
    assert.equal(status.sourceMode, "package");
    assert.equal(status.input.sourceMode, "package");
    assert.equal(status.readiness, "ready");
    assert.equal(status.adapter.target, "bootstrap-html");
    assert.equal(status.prototypeTarget.target, "standalone-html");
    assert.equal(status.roles.length, 6);
    assert.equal(status.acceptance.invariantCount, 1);
    assert.deepEqual(status.errors, []);
  });

  test("reports blocked and invalid package status", async () => {
    const blockedDir = await createReadyPackage();
    await writeFile(path.join(blockedDir, "prototype.md"), `# Prototype: Blocked [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype"]

Includes:
- screens.md [role="screens" required="true"]
- missing.md [role="content" required="true"]
`);

    const blocked = runCli(["status", blockedDir, "--json"]);
    assert.equal(blocked.status, 1);
    const blockedJson = JSON.parse(blocked.stdout);
    assert.equal(blockedJson.readiness, "blocked");
    assert.equal(blockedJson.errors[0].code, "missing_package_include");

    const invalidDir = await createReadyPackage();
    await writeFile(path.join(invalidDir, "content.md"), `## Content: Metric Data [id="metric-data" type="metrics"]
- Metric: Pipeline [value="$8.6M" tone="positive"]

## Content: Duplicate [id="dashboard" type="copy"]
- Text: duplicate id
`);

    const invalid = runCli(["status", invalidDir, "--json"]);
    assert.equal(invalid.status, 1);
    const invalidJson = JSON.parse(invalid.stdout);
    assert.equal(invalidJson.readiness, "invalid");
    assert.ok(invalidJson.validationErrors.some((error) => error.code === "duplicate_package_id"));
  });

  test("reports valid and invalid single-file status", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "spec-ui-status-"));
    const validPath = path.join(dir, "valid.md");
    const invalidPath = path.join(dir, "invalid.md");
    await writeFile(validPath, `# Spec: Single File [surface="app" adapter="baseline"]
## Screen: Home [id="home" shell="app" kind="dashboard"]
### Section: Main [id="main"]
- text#headline: Hello
`);
    await writeFile(invalidPath, `# Spec: Broken
`);

    const valid = runCli(["status", validPath, "--json"]);
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(JSON.parse(valid.stdout).readiness, "ready");
    assert.equal(JSON.parse(valid.stdout).sourceMode, "single-file");

    const invalid = runCli(["status", invalidPath, "--json"]);
    assert.equal(invalid.status, 1);
    const status = JSON.parse(invalid.stdout);
    assert.equal(status.readiness, "invalid");
    assert.equal(status.errors[0].code, "no_screens");
  });

  test("reports missing and ambiguous named inputs", async () => {
    const missing = runCli(["status", "does-not-exist", "--json"]);
    assert.equal(missing.status, 1);
    assert.equal(missing.stderr, "");
    assert.equal(JSON.parse(missing.stdout).errors[0].code, "input_not_found");

    const dir = await mkdtemp(path.join(tmpdir(), "spec-ui-ambiguous-"));
    await mkdir(path.join(dir, ".spec-ui"));
    await mkdir(path.join(dir, "prototypes"));
    await mkdir(path.join(dir, "examples"));
    await writeFile(
      path.join(dir, ".spec-ui", "config.json"),
      `${JSON.stringify({
        schemaVersion: 1,
        defaultAdapter: "bootstrap-html",
        defaultTarget: "standalone-html",
        prototypesDir: "prototypes",
        artifactsDir: "artifacts",
        requiredRoles: ["screens", "flows", "content", "layout", "acceptance"],
        optionalRoles: ["tokens"]
      }, null, 2)}\n`
    );
    const configured = path.join(dir, "prototypes", "task-board");
    await createReadyPackage(configured);
    await writeFile(path.join(dir, "examples", "task-board.md"), `# Spec: Task Board
## Screen: Home [id="home" shell="app" kind="dashboard"]
### Section: Main [id="main"]
- text#headline: Hello
`);

    const ambiguous = runCli(["status", "task-board", "--json"], { cwd: dir });
    assert.equal(ambiguous.status, 2);
    const error = JSON.parse(ambiguous.stdout).errors[0];
    assert.equal(error.code, "ambiguous_input");
    assert.equal(error.candidates.length, 2);
  });

  test("resolves built-in example names outside the repo cwd", () => {
    const result = runCli(["status", "task-board", "--json"], { cwd: tmpdir() });

    assert.equal(result.status, 0, result.stderr);
    const status = JSON.parse(result.stdout);
    assert.equal(status.readiness, "ready");
    assert.equal(status.input.sourceMode, "single-file");
  });
});

describe("spec-ui compile compatibility", () => {
  test("keeps compile --status as JSON status compatibility", async () => {
    const packageDir = await createReadyPackage();
    const result = runCli(["compile", packageDir, "--status"]);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    const status = JSON.parse(result.stdout);
    assert.equal(status.command, "status");
    assert.equal(status.sourceMode, "package");
    assert.equal(status.readiness, "ready");
    assert.equal(status.validationErrors.length, 0);
  });

  test("rejects compile without --out as a usage error", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "spec-ui-compile-"));
    const inputPath = path.join(dir, "input.md");
    await writeFile(inputPath, `# Spec: Missing Out
## Screen: Home [id="home" shell="app" kind="dashboard"]
### Section: Main [id="main"]
- text#headline: Hello
`);

    const result = runCli(["compile", inputPath]);
    assert.equal(result.status, 2);
    assert.equal(JSON.parse(result.stderr).errors[0].code, "missing_output");
  });

  test("prints clean handoff JSON for compile --json", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "spec-ui-compile-json-"));
    const inputPath = path.join(dir, "input.md");
    const outputPath = path.join(dir, "prototype.html");
    await writeFile(inputPath, `# Spec: JSON Compile [surface="app" adapter="baseline"]
## Screen: Home [id="home" shell="app" kind="dashboard"]
### Section: Main [id="main"]
- text#headline: Hello
`);

    const result = runCli(["compile", inputPath, "--out", outputPath, "--json"]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    const handoff = JSON.parse(result.stdout);
    assert.equal(handoff.artifactPath, outputPath);
    assert.equal(handoff.inputPath, inputPath);
    assert.equal(handoff.sourceMode, "single-file");
    assert.match(handoff.sourceHash, /^[a-f0-9]{64}$/);
  });

  test("resolves relative compile outputs against injected cwd", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "spec-ui-runcli-cwd-"));
    const inputPath = path.join(dir, "input.md");
    await writeFile(inputPath, `# Spec: Cwd Compile [surface="app" adapter="baseline"]
## Screen: Home [id="home" shell="app" kind="dashboard"]
### Section: Main [id="main"]
- text#headline: Hello
`);
    const stdout = captureStream();
    const stderr = captureStream();

    const exitCode = await runCliInProcess(
      ["compile", "input.md", "--out", "artifact.html", "--json"],
      {
        cwd: dir,
        stdout,
        stderr,
        env: process.env
      }
    );

    assert.equal(exitCode, 0, stderr.text);
    assert.equal(stderr.text, "");
    assert.equal(await exists(path.join(dir, "artifact.html")), true);
    assert.equal(JSON.parse(stdout.text).artifactPath, path.join(dir, "artifact.html"));
  });
});

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...(options.env ?? {})
    }
  });
}

function captureStream() {
  return {
    text: "",
    write(chunk) {
      this.text += chunk;
    }
  };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function createReadyPackage(targetDir) {
  const packageDir = targetDir ?? await mkdtemp(path.join(tmpdir(), "spec-ui-package-"));
  await mkdir(packageDir, { recursive: true });
  await writeFile(path.join(packageDir, "prototype.md"), `# Prototype: CLI Package [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype"]

Includes:
- screens.md [role="screens" required="true"]
- flows.md [role="flows" required="true"]
- content.md [role="content" required="true"]
- layout.md [role="layout" required="true"]
- tokens.md [role="tokens" required="true"]
- acceptance.md [role="acceptance" required="true"]
`);
  await writeFile(path.join(packageDir, "screens.md"), `## Screen: Dashboard [id="dashboard" shell="app" kind="dashboard" gap="md"]
### Region: Main [id="main" type="content" gap="md"]
#### Block: Metrics [id="metrics" type="metric-row" gap="md" content="metric-data"]
`);
  await writeFile(path.join(packageDir, "flows.md"), `## Flow: Primary [id="primary" start="dashboard"]
- Step: Stay [from="dashboard" action="navigate:dashboard" to="dashboard"]
`);
  await writeFile(path.join(packageDir, "content.md"), `## Content: Metric Data [id="metric-data" type="metrics"]
- Metric: Pipeline [value="$8.6M" tone="positive"]
`);
  await writeFile(path.join(packageDir, "layout.md"), `## Layout: Metrics [target="block:metrics"]
- Control: density [value="compact"]
`);
  await writeFile(path.join(packageDir, "tokens.md"), `## Tokens: Theme [id="default"]
- Tone: brand [value="blue"]
`);
  await writeFile(path.join(packageDir, "acceptance.md"), `## Acceptance
- Invariant: Reachable flow [target="flow:primary"]
`);
  return packageDir;
}
