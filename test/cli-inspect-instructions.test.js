import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

import { DEFAULT_CONFIG } from "../src/cli/templates.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const cliPath = join(repoRoot, "bin/spec-ui.mjs");

describe("spec-ui list, show, and instructions CLI", () => {
  test("validates prototypes without writing artifacts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-validate-"));
    const packageDir = await createReadyPackage(dir, "ready-package");

    const human = run(["validate", packageDir]);
    assert.equal(human.status, 0, human.stderr);
    assert.match(human.stdout, /Valid: Ready Package/);

    const json = run(["validate", packageDir, "--strict", "--json"]);
    assert.equal(json.status, 0, json.stderr);
    const body = JSON.parse(json.stdout);
    assert.equal(body.command, "validate");
    assert.equal(body.ok, true);
    assert.equal(body.readiness, "ready");

    const artifactsDir = join(dir, "artifacts");
    assert.equal(await exists(artifactsDir), false);
  });

  test("strict validation rejects config-required roles that are optional and missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-strict-"));
    const packageDir = join(dir, "optional-content");
    await mkdir(packageDir, { recursive: true });
    await writeFile(join(packageDir, "prototype.md"), `# Prototype: Optional Content [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype"]

Includes:
- screens.md [role="screens" required="true"]
- flows.md [role="flows" required="true"]
- content.md [role="content" required="false"]
- layout.md [role="layout" required="true"]
- acceptance.md [role="acceptance" required="true"]
`);
    await writeFile(join(packageDir, "screens.md"), `## Screen: Dashboard [id="dashboard" shell="app" kind="dashboard" gap="md"]
### Region: Main [id="main" type="content" gap="md"]
#### Block: Header [id="header" type="page-header" gap="md"]
- text#headline: Hello
`);
    await writeFile(join(packageDir, "flows.md"), `## Flow: Primary [id="primary" start="dashboard"]
- Step: Stay [from="dashboard" action="navigate:dashboard" to="dashboard"]
`);
    await writeFile(join(packageDir, "layout.md"), `## Layout: Header [target="block:header"]
- Control: gap [value="md"]
`);
    await writeFile(join(packageDir, "acceptance.md"), `## Acceptance
- Invariant: Reachable flow [target="flow:primary"]
`);

    const result = run(["validate", packageDir, "--strict", "--json"]);

    assert.equal(result.status, 1);
    const body = JSON.parse(result.stdout);
    assert.equal(body.readiness, "invalid");
    assert.ok(body.errors.some((error) => error.code === "missing_required_role"));
  });

  test("lists built-in examples and adapters as deterministic JSON", () => {
    const examples = run(["list", "--json"]);

    assert.equal(examples.status, 0, examples.stderr);
    const list = JSON.parse(examples.stdout);
    assert.equal(list.command, "list");
    assert.equal(list.ok, true);
    assert.deepEqual(
      list.examples.map((item) => item.name),
      [
        "launchlayer-marketing-package",
        "marketing-landing",
        "revenue-workspace-package",
        "saas-dashboard",
        "task-board"
      ]
    );
    assert.deepEqual(list.packages, []);

    const adapters = run(["list", "--adapters", "--json"]);
    assert.equal(adapters.status, 0, adapters.stderr);
    const adapterList = JSON.parse(adapters.stdout);
    assert.deepEqual(
      adapterList.adapters.map((adapter) => adapter.target),
      ["baseline", "bootstrap-html"]
    );
    assert.equal(adapterList.adapters[1].resolvedLibrary.name, "Bootstrap");
  });

  test("shows package metadata, include structure, adapter, and acceptance summary", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-show-"));
    const packageDir = await createReadyPackage(dir, "ready-package");

    const result = run(["show", packageDir, "--json"]);

    assert.equal(result.status, 0, result.stderr);
    const show = JSON.parse(result.stdout);
    assert.equal(show.command, "show");
    assert.equal(show.ok, true);
    assert.equal(show.sourceMode, "package");
    assert.equal(show.title, "Ready Package");
    assert.match(show.manifestPath, /ready-package\/prototype\.md$/);
    assert.equal(show.adapter.target, "bootstrap-html");
    assert.equal(show.target, "standalone-html");
    assert.equal(show.fidelity, "prototype");
    assert.deepEqual(
      show.roles.map((role) => [role.role, role.status]),
      [
        ["screens", "resolved"],
        ["flows", "resolved"],
        ["content", "resolved"],
        ["layout", "resolved"],
        ["acceptance", "resolved"]
      ]
    );
    assert.equal(show.acceptance.invariantCount, 1);
  });

  test("prints bounded layout guidance with package context and role file path", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-instructions-"));
    const packageDir = await createReadyPackage(dir, "ready-package");

    const result = run(["instructions", "layout", "--input", packageDir]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Readiness: ready/);
    assert.match(result.stdout, /Role file: .*ready-package\/layout\.md/);
    assert.match(result.stdout, /symbolic gap values/);
    assert.match(result.stdout, /wrapping expectations/);
    assert.match(result.stdout, /modal\/dialog/);
    assert.match(result.stdout, /filters and navigation/);
    assert.match(result.stdout, /nested cards/);
  });

  test("includes initialized local instructions for named package JSON output", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-local-instructions-"));
    await mkdir(join(dir, ".spec-ui"), { recursive: true });
    await writeFile(
      join(dir, ".spec-ui", "config.json"),
      `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`
    );
    await writeFile(
      join(dir, ".spec-ui", "instructions.md"),
      "# Local Spec UI Instructions\n\nKeep accepted prototypes portable.\n"
    );
    await createReadyPackage(join(dir, "prototypes"), "starter");

    const packages = run(["list", "--packages", "--json"], { cwd: dir });
    assert.equal(packages.status, 0, packages.stderr);
    assert.deepEqual(JSON.parse(packages.stdout).packages, [
      {
        name: "starter",
        sourceMode: "package",
        path: "prototypes/starter",
        manifestPath: "prototypes/starter/prototype.md"
      }
    ]);

    const result = run(["instructions", "content", "--input", "starter", "--json"], {
      cwd: dir
    });

    assert.equal(result.status, 0, result.stderr);
    const body = JSON.parse(result.stdout);
    assert.equal(body.command, "instructions");
    assert.equal(body.role, "content");
    assert.equal(body.readiness, "ready");
    assert.equal(body.roleFile.path, "prototypes/starter/content.md");
    assert.equal(body.localInstructions.path, ".spec-ui/instructions.md");
    assert.match(body.localInstructions.content, /portable/);
    assert.match(body.instructions[0].guidance.join("\n"), /semantic grammar/);
  });

  test("resolves built-in package aliases consistently for show and instructions", () => {
    const show = run(["show", "revenue-workspace", "--json"]);
    assert.equal(show.status, 0, show.stderr);
    assert.equal(JSON.parse(show.stdout).title, "Revenue Workspace");

    const instructions = run([
      "instructions",
      "layout",
      "--input",
      "revenue-workspace",
      "--json"
    ]);
    assert.equal(instructions.status, 0, instructions.stderr);
    assert.equal(JSON.parse(instructions.stdout).roleFile.path, "examples/revenue-workspace-package/layout.md");
  });

  test("rejects invalid config for inspect commands", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-invalid-config-"));
    await mkdir(join(dir, ".spec-ui"), { recursive: true });
    await writeFile(
      join(dir, ".spec-ui", "config.json"),
      `${JSON.stringify({ ...DEFAULT_CONFIG, defaultAdapter: "unknown" }, null, 2)}\n`
    );

    const result = run(["list", "--packages", "--json"], { cwd: dir });

    assert.equal(result.status, 1);
    const body = JSON.parse(result.stdout);
    assert.equal(body.errors[0].code, "unsupported_config");
  });

  test("does not return editable role paths for outside-root includes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-outside-include-"));
    const packageDir = join(dir, "bad-package");
    await mkdir(packageDir, { recursive: true });
    await writeFile(join(packageDir, "prototype.md"), `# Prototype: Bad Package [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype"]

Includes:
- ../screens.md [role="screens" required="true"]
- flows.md [role="flows" required="true"]
- content.md [role="content" required="true"]
- layout.md [role="layout" required="true"]
- acceptance.md [role="acceptance" required="true"]
`);
    await writeFile(join(packageDir, "flows.md"), "");
    await writeFile(join(packageDir, "content.md"), "");
    await writeFile(join(packageDir, "layout.md"), "");
    await writeFile(join(packageDir, "acceptance.md"), "## Acceptance\n");

    const result = run(["instructions", "screens", "--input", packageDir, "--json"]);

    assert.equal(result.status, 0, result.stderr);
    const body = JSON.parse(result.stdout);
    assert.equal(body.readiness, "blocked");
    assert.equal(body.roleFile, null);
  });

  test("reports missing instructions input as a usage error in JSON mode", () => {
    const result = run(["instructions", "layout", "--json"]);

    assert.equal(result.status, 2);
    const body = JSON.parse(result.stdout);
    assert.equal(body.errors[0].code, "missing_input");
  });

  test("rejects unsupported instruction roles with suggestions and exit code 2", () => {
    const result = run([
      "instructions",
      "wireframes",
      "--input",
      "examples/task-board.md",
      "--json"
    ]);

    assert.equal(result.status, 2);
    const body = JSON.parse(result.stdout);
    assert.equal(body.errors[0].code, "unsupported_role");
    assert.deepEqual(body.errors[0].suggestions, [
      "screens",
      "flows",
      "content",
      "layout",
      "tokens",
      "acceptance"
    ]);
  });
});

function run(args, options = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8"
  });
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function createReadyPackage(root, name) {
  const packageDir = join(root, name);
  await mkdir(packageDir, { recursive: true });
  await writeFile(join(packageDir, "prototype.md"), `# Prototype: Ready Package [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype"]

Includes:
- screens.md [role="screens" required="true"]
- flows.md [role="flows" required="true"]
- content.md [role="content" required="true"]
- layout.md [role="layout" required="true"]
- acceptance.md [role="acceptance" required="true"]
`);
  await writeFile(join(packageDir, "screens.md"), `## Screen: Dashboard [id="dashboard" shell="app" kind="dashboard" gap="md"]
### Region: Main [id="main" type="content" gap="md"]
#### Block: Metrics [id="metrics" type="metric-row" gap="md" content="metric-data"]
`);
  await writeFile(join(packageDir, "flows.md"), `## Flow: Primary [id="primary" start="dashboard"]
- Step: Stay [from="dashboard" action="navigate:dashboard" to="dashboard"]
`);
  await writeFile(join(packageDir, "content.md"), `## Content: Metric Data [id="metric-data" type="metrics"]
- Metric: Pipeline [value="$8.6M" tone="positive"]
`);
  await writeFile(join(packageDir, "layout.md"), `## Layout: Metrics [target="block:metrics"]
- Control: density [value="compact"]
`);
  await writeFile(join(packageDir, "acceptance.md"), `## Acceptance
- Invariant: Reachable flow [target="flow:primary"]
`);

  return packageDir;
}
