#!/usr/bin/env node
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

import { createHandoffResult } from "../src/handoff.js";
import { renderHtml } from "../src/render-html.js";

async function main(argv) {
  const [command, ...args] = argv;

  if (command !== "compile") {
    printUsage();
    return command ? 1 : 0;
  }

  const options = parseCompileArgs(args);
  if (options.errors.length > 0) {
    printJsonError(options.errors);
    return 1;
  }

  try {
    const compiler = await loadCompiler();
    const input = await readCompileInput(options.inputPath, compiler);

    if (options.status) {
      if (input.sourceMode !== "package") {
        process.stdout.write(`${JSON.stringify({
          sourceMode: "single-file",
          inputPath: options.inputPath,
          readiness: "ready"
        }, null, 2)}\n`);
        return 0;
      }

      const status = compiler.getPackageStatus(input.packageInput);
      process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
      return status.readiness === "ready" ? 0 : 1;
    }

    const ir = input.sourceMode === "package"
      ? compiler.compilePackageToIr(input.packageInput)
      : compiler.compileToIr(input.markdown);
    const html = renderHtml(ir);

    await writeArtifact(options.outputPath, html);

    if (options.irPath) {
      const serialized =
        typeof compiler.serializeIr === "function"
          ? compiler.serializeIr(ir)
          : `${JSON.stringify(ir, null, 2)}\n`;
      await writeArtifact(options.irPath, serialized);
    }

    const handoff = createHandoffResult({
      inputPath: options.inputPath,
      outputPath: options.outputPath,
      irPath: options.irPath,
      html,
      ir,
      warnings: ir?.warnings || []
    });

    process.stdout.write(`${JSON.stringify(handoff, null, 2)}\n`);
    return 0;
  } catch (error) {
    printJsonError(normalizeErrors(error));
    return 1;
  }
}

function parseCompileArgs(args) {
  const result = {
    inputPath: undefined,
    outputPath: undefined,
    irPath: undefined,
    status: false,
    errors: []
  };

  if (args[0] && !args[0].startsWith("--")) {
    result.inputPath = args[0];
  }

  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--out") {
      result.outputPath = args[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--ir") {
      result.irPath = args[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--status") {
      result.status = true;
      continue;
    }
    result.errors.push({
      code: "unknown_argument",
      message: `Unknown argument "${arg}".`
    });
  }

  if (!result.inputPath) {
    result.errors.push({
      code: "missing_input",
      message: "compile requires an input markdown path."
    });
  }

  if (!result.outputPath && !result.status) {
    result.errors.push({
      code: "missing_output",
      message: "compile requires --out <output.html>."
    });
  }

  return result;
}

async function loadCompiler() {
  const modulePath = process.env.SPEC_UI_COMPILER_MODULE || "../src/compiler.js";
  return import(modulePath);
}

async function readCompileInput(inputPath, compiler) {
  const stats = await stat(inputPath);
  const manifestPath = stats.isDirectory() ? join(inputPath, "prototype.md") : inputPath;
  const markdown = await readFile(manifestPath, "utf8");
  const isPackage = stats.isDirectory() ||
    basename(manifestPath) === "prototype.md" ||
    markdown.trimStart().startsWith("# Prototype:");

  if (!isPackage) {
    return {
      sourceMode: "single-file",
      markdown
    };
  }

  if (typeof compiler.parsePackageManifest !== "function" ||
      typeof compiler.compilePackageToIr !== "function") {
    throw new Error("Loaded compiler module does not support package compilation.");
  }

  const packageRoot = dirname(manifestPath);
  const manifest = compiler.parsePackageManifest(markdown, {
    manifestPath,
    packageRoot
  });
  const files = [];

  for (const include of manifest.includes ?? []) {
    if (!include.insideRoot) continue;
    try {
      files.push({
        path: include.path,
        contents: await readFile(include.absolutePath, "utf8")
      });
    } catch {
      // Missing required includes are reported by the compiler/status model.
    }
  }

  return {
    sourceMode: "package",
    packageInput: {
      manifestPath,
      packageRoot,
      manifestMarkdown: markdown,
      files
    }
  };
}

async function writeArtifact(path, contents) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, "utf8");
}

function normalizeErrors(error) {
  if (Array.isArray(error?.errors)) {
    return error.errors;
  }

  return [
    {
      code: error?.code || "compile_failed",
      message: error?.message || "Compilation failed."
    }
  ];
}

function printJsonError(errors) {
  process.stderr.write(`${JSON.stringify({ errors }, null, 2)}\n`);
}

function printUsage() {
  process.stderr.write(
    "Usage: spec-ui compile <input.md|package-dir> --out <output.html> [--ir <output.json>] [--status]\n"
  );
}

const exitCode = await main(process.argv.slice(2));
process.exit(exitCode);
