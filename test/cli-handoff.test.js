import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, test } from "node:test";

import { createHandoffResult } from "../src/handoff.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const cliPath = join(repoRoot, "bin/spec-ui.mjs");

async function createCompilerModule(dir) {
  const compilerPath = join(dir, "compiler.mjs");
  await writeFile(
    compilerPath,
    `export function compileToIr(markdown) {
  if (markdown.includes("INVALID")) {
    const error = new Error("Spec validation failed.");
    error.errors = [{ code: "missing_screen", message: "Screen is required.", line: 1 }];
    throw error;
  }

  return {
    metadata: { title: "CLI Prototype" },
    screens: [{
      id: "home",
      title: "Home",
      sections: [{
        id: "main",
        title: "Main",
        elements: [{ id: "headline", type: "text", label: markdown.trim() }],
        actions: []
      }],
      states: []
    }]
  };
}

export function serializeIr(ir) {
  return JSON.stringify(ir, null, 2) + "\\n";
}
`
  );
  return pathToFileURL(compilerPath).href;
}

describe("createHandoffResult", () => {
  test("returns deterministic portable viewer metadata", () => {
    const sourceHash = "a".repeat(64);
    const handoff = createHandoffResult({
      inputPath: "/tmp/source.md",
      outputPath: "/tmp/prototype.html",
      irPath: "/tmp/prototype.ir.json",
      html: "<!doctype html>\n",
      ir: { metadata: { sourceHash }, screens: [{ id: "home" }] },
      warnings: [{ code: "fallback", message: "Used fallback." }]
    });

    assert.equal(handoff.artifactPath, "/tmp/prototype.html");
    assert.equal(handoff.irPath, "/tmp/prototype.ir.json");
    assert.equal(handoff.inputPath, "/tmp/source.md");
    assert.equal(handoff.sourceHash, sourceHash);
    assert.deepEqual(handoff.viewerCompatibility, ["browser", "microcanvas"]);
    assert.deepEqual(handoff.warnings, [
      { code: "fallback", message: "Used fallback." }
    ]);
    assert.equal(
      handoff.sourceHash,
      createHandoffResult({
        inputPath: "/tmp/source.md",
        outputPath: "/tmp/prototype.html",
        html: "<!doctype html>\n",
        ir: { metadata: { sourceHash }, screens: [{ id: "home" }] }
      }).sourceHash
    );
  });
});

describe("spec-ui compile CLI", () => {
  test("writes HTML and optional IR, then prints handoff metadata", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-cli-"));
    const compilerModule = await createCompilerModule(dir);
    const inputPath = join(dir, "input.md");
    const outputPath = join(dir, "prototype.html");
    const irPath = join(dir, "prototype.ir.json");
    await writeFile(inputPath, "# Spec: CLI Prototype\n");

    const result = spawnSync(
      process.execPath,
      [cliPath, "compile", inputPath, "--out", outputPath, "--ir", irPath],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          SPEC_UI_COMPILER_MODULE: compilerModule
        }
      }
    );

    assert.equal(result.status, 0, result.stderr);
    const metadata = JSON.parse(result.stdout);
    assert.equal(metadata.artifactPath, outputPath);
    assert.equal(metadata.irPath, irPath);
    assert.deepEqual(metadata.viewerCompatibility, ["browser", "microcanvas"]);
    assert.match(metadata.sourceHash, /^[a-f0-9]{64}$/);

    const html = await readFile(outputPath, "utf8");
    const ir = await readFile(irPath, "utf8");
    assert.match(html, /<!doctype html>/);
    assert.match(html, /# Spec: CLI Prototype/);
    assert.match(ir, /"title": "CLI Prototype"/);
  });

  test("prints JSON validation errors and exits nonzero on compilation failure", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-cli-"));
    const compilerModule = await createCompilerModule(dir);
    const inputPath = join(dir, "invalid.md");
    const outputPath = join(dir, "prototype.html");
    await writeFile(inputPath, "INVALID\n");

    const result = spawnSync(
      process.execPath,
      [cliPath, "compile", inputPath, "--out", outputPath],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          SPEC_UI_COMPILER_MODULE: compilerModule
        }
      }
    );

    assert.notEqual(result.status, 0);
    assert.deepEqual(JSON.parse(result.stderr), {
      errors: [
        { code: "missing_screen", message: "Screen is required.", line: 1 }
      ]
    });
  });

  test("compiles package directories and exposes package status", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-cli-package-"));
    const packageDir = join(dir, "revenue-workspace");
    const outputPath = join(dir, "prototype.html");
    const irPath = join(dir, "prototype.ir.json");
    await mkdir(packageDir);
    await writeFile(join(packageDir, "prototype.md"), `# Prototype: CLI Package [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype"]

Includes:
- screens.md [role="screens" required="true"]
- flows.md [role="flows" required="true"]
- content.md [role="content" required="true"]
- layout.md [role="layout" required="true"]
- tokens.md [role="tokens" required="true"]
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
    await writeFile(join(packageDir, "tokens.md"), `## Tokens: Theme [id="default"]
- Tone: brand [value="blue"]
`);
    await writeFile(join(packageDir, "acceptance.md"), `## Acceptance
- Invariant: Reachable flow [target="flow:primary"]
`);

    const status = spawnSync(
      process.execPath,
      [cliPath, "compile", packageDir, "--status"],
      {
        cwd: repoRoot,
        encoding: "utf8"
      }
    );

    assert.equal(status.status, 0, status.stderr);
    const statusJson = JSON.parse(status.stdout);
    assert.equal(statusJson.readiness, "ready");
    assert.equal(statusJson.sourceMode, "package");
    assert.equal(statusJson.acceptance.invariantCount, 1);

    const result = spawnSync(
      process.execPath,
      [cliPath, "compile", packageDir, "--out", outputPath, "--ir", irPath],
      {
        cwd: repoRoot,
        encoding: "utf8"
      }
    );

    assert.equal(result.status, 0, result.stderr);
    const handoff = JSON.parse(result.stdout);
    assert.equal(handoff.sourceMode, "package");
    assert.equal(handoff.package.title, "CLI Package");
    assert.equal(handoff.adapter.target, "bootstrap-html");
    assert.equal(handoff.resolvedLibrary.name, "bootstrap");
    assert.equal(handoff.packageReadiness.readiness, "ready");

    const ir = JSON.parse(await readFile(irPath, "utf8"));
    assert.equal(ir.metadata.sourceMode, "package");
    assert.equal(ir.screens[0].regions[0].blocks[0].items[0].source.role, "content");
    assert.match(await readFile(outputPath, "utf8"), /CLI Package/);
  });

  test("rejects duplicate package ids across screen and content role files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "spec-ui-cli-package-"));
    const packageDir = join(dir, "duplicate-package");
    await mkdir(packageDir);
    await writeFile(join(packageDir, "prototype.md"), `# Prototype: Duplicate Package [surface="app" adapter="bootstrap-html" target="standalone-html" fidelity="prototype"]

Includes:
- screens.md [role="screens" required="true"]
- content.md [role="content" required="true"]
`);
    await writeFile(join(packageDir, "screens.md"), `## Screen: Dashboard [id="dashboard" shell="app" kind="dashboard" gap="md"]
### Region: Main [id="main" type="content" gap="md"]
#### Block: Shared Card [id="shared-card" type="detail-panel" gap="md" content="shared-card"]
`);
    await writeFile(join(packageDir, "content.md"), `## Content: Shared Card [id="shared-card" type="copy"]
- Text: Duplicate content id.
`);

    const result = spawnSync(
      process.execPath,
      [cliPath, "compile", packageDir, "--status"],
      {
        cwd: repoRoot,
        encoding: "utf8"
      }
    );

    assert.notEqual(result.status, 0);
    const status = JSON.parse(result.stdout);
    assert.equal(status.readiness, "invalid");
    assert.deepEqual(
      status.validationErrors.map((error) => error.code),
      ["duplicate_package_id"]
    );
  });
});
