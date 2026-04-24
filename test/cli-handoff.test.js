import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
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
});
