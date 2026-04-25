import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { createHandoffResult } from "../handoff.js";
import { renderHtml } from "../render-html.js";
import { commandHelp, commandNames, topLevelHelp, versionText } from "./help.js";
import { loadSpecUiConfig } from "./config.js";
import { resolvePrototypeInput } from "./input.js";
import { runInstructionsCommand } from "./instructions.js";
import { runInitCommand } from "./init.js";
import {
  EXIT_CODES,
  CliError,
  normalizeErrors,
  parseCommandOptions,
  usageError
} from "./options.js";
import {
  formatStatusHuman,
  statusToJson,
  writeError,
  writeJson
} from "./format.js";
import { createStatusResult } from "./status.js";
import { runListCommand, runShowCommand } from "./show.js";

export async function runCli(argv, io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const cwd = io.cwd ?? process.cwd();
  const env = io.env ?? process.env;
  const [command, ...args] = argv;

  try {
    if (!command || command === "--help" || command === "-h") {
      stdout.write(topLevelHelp());
      return EXIT_CODES.ok;
    }

    if (command === "--version" || command === "-v") {
      stdout.write(versionText());
      return EXIT_CODES.ok;
    }

    if (command === "help") {
      return handleHelp(args, stdout);
    }

    if (!commandNames().includes(command)) {
      throw usageError({
        code: "unknown_command",
        message: `Unknown command "${command}". Run "spec-ui --help" for usage.`
      });
    }

    if (args.includes("--help") || args.includes("-h")) {
      stdout.write(commandHelp(command));
      return EXIT_CODES.ok;
    }

    if (command === "status") {
      return await handleStatus(args, { stdout, stderr, cwd, env });
    }

    if (command === "validate") {
      return await handleValidate(args, { stdout, stderr, cwd, env });
    }

    if (command === "init") {
      return await runInitCommand(args, { stdout, stderr, cwd });
    }

    if (command === "list") {
      return await runListCommand(args, { stdout, stderr, cwd });
    }

    if (command === "show") {
      return await runShowCommand(args, { stdout, stderr, cwd });
    }

    if (command === "instructions") {
      return await runInstructionsCommand(args, { stdout, stderr, cwd });
    }

    if (command === "compile") {
      return await handleCompile(args, { stdout, stderr, cwd, env });
    }

    return handleDeferredCommand(command, args, { stdout, stderr });
  } catch (error) {
    const cliError = error instanceof CliError
      ? error
      : new CliError({
          code: error?.code || "command_failed",
          message: error?.message || "Command failed."
        });
    const json = args.includes("--json");
    writeError({ stdout, stderr, json, command, error: cliError.error });
    return cliError.exitCode;
  }
}

function handleHelp(args, stdout) {
  if (args.length === 0) {
    stdout.write(topLevelHelp());
    return EXIT_CODES.ok;
  }

  if (args.length > 1 || !commandNames().includes(args[0])) {
    throw usageError({
      code: "unknown_command",
      message: `Unknown help topic "${args[0] ?? ""}". Run "spec-ui --help" for usage.`
    });
  }

  stdout.write(commandHelp(args[0]));
  return EXIT_CODES.ok;
}

async function handleStatus(args, io) {
  const parsed = parseCommandOptions(args, {
    flags: ["--json"],
    minPositionals: 1,
    maxPositionals: 1,
    missingCode: "missing_input",
    missingMessage: "status requires an input path or package name."
  });
  const compiler = await loadCompiler(io.env);
  const input = await resolvePrototypeInput(parsed.positionals[0], {
    cwd: io.cwd,
    repoRoot: io.cwd
  });
  const result = await createStatusResult({
    command: "status",
    input,
    compiler
  });

  if (parsed.json) {
    writeJson(io.stdout, statusToJson(result));
  } else {
    io.stdout.write(formatStatusHuman(result));
  }

  return result.readiness === "ready" ? EXIT_CODES.ok : EXIT_CODES.runtime;
}

async function handleValidate(args, io) {
  const parsed = parseCommandOptions(args, {
    flags: ["--json", "--strict"],
    minPositionals: 1,
    maxPositionals: 1,
    missingCode: "missing_input",
    missingMessage: "validate requires an input path or package name."
  });
  const compiler = await loadCompiler(io.env);
  const input = await resolvePrototypeInput(parsed.positionals[0], {
    cwd: io.cwd,
    repoRoot: io.cwd
  });
  const result = await createStatusResult({
    command: "validate",
    input,
    compiler
  });

  if (parsed.values["--strict"]) {
    const config = loadSpecUiConfig({ cwd: io.cwd });
    if (!config.ok) {
      result.errors.push(...config.errors);
      result.readiness = "invalid";
    } else if (input.sourceMode === "package") {
      for (const role of config.config.requiredRoles) {
        const presentRole = result.roles.find((item) => item.role === role);
        if (!presentRole || presentRole.required !== true || presentRole.status !== "resolved") {
          result.errors.push({
            code: "missing_required_role",
            message: `Package must include required role "${role}" as a resolved required include.`
          });
        }
      }
      if (result.errors.length > 0 && result.readiness === "ready") {
        result.readiness = "invalid";
      }
    }
  }

  if (parsed.json) {
    writeJson(io.stdout, statusToJson(result));
  } else if (result.readiness === "ready") {
    io.stdout.write(`Valid: ${result.title || result.input.path}\n`);
  } else {
    io.stdout.write(formatStatusHuman(result));
  }

  return result.readiness === "ready" ? EXIT_CODES.ok : EXIT_CODES.runtime;
}

async function handleCompile(args, io) {
  const parsed = parseCommandOptions(args, {
    flags: ["--json", "--status"],
    valueOptions: ["--out", "--ir"],
    minPositionals: 1,
    maxPositionals: 1,
    missingCode: "missing_input",
    missingMessage: "compile requires an input path or package name."
  });
  const inputName = parsed.positionals[0];
  const compiler = await loadCompiler(io.env);
  const input = await resolvePrototypeInput(inputName, {
    cwd: io.cwd,
    repoRoot: io.cwd
  });

  if (parsed.values["--status"]) {
    const result = await createStatusResult({
      command: "status",
      input,
      compiler
    });
    writeJson(io.stdout, statusToJson(result));
    return result.readiness === "ready" ? EXIT_CODES.ok : EXIT_CODES.runtime;
  }

  const outputPath = parsed.values["--out"];
  if (!outputPath) {
    throw usageError({
      code: "missing_output",
      message: "compile requires --out <output.html>."
    });
  }
  const resolvedOutputPath = resolve(io.cwd, outputPath);
  const resolvedIrPath = parsed.values["--ir"]
    ? resolve(io.cwd, parsed.values["--ir"])
    : undefined;

  try {
    const ir = input.sourceMode === "package"
      ? compiler.compilePackageToIr(input.packageInput)
      : compiler.compileToIr(input.markdown);
    const html = renderHtml(ir);

    await writeArtifact(resolvedOutputPath, html);

    if (resolvedIrPath) {
      const serialized =
        typeof compiler.serializeIr === "function"
          ? compiler.serializeIr(ir)
          : `${JSON.stringify(ir, null, 2)}\n`;
      await writeArtifact(resolvedIrPath, serialized);
    }

    const handoff = createHandoffResult({
      inputPath: input.path,
      outputPath: resolvedOutputPath,
      irPath: resolvedIrPath,
      html,
      ir,
      warnings: ir?.warnings || []
    });

    writeJson(io.stdout, handoff);
    return EXIT_CODES.ok;
  } catch (error) {
    const payload = {
      command: "compile",
      ok: false,
      errors: normalizeErrors(error)
    };

    if (parsed.json) {
      writeJson(io.stdout, payload);
    } else {
      writeJson(io.stderr, { errors: payload.errors });
    }

    return EXIT_CODES.runtime;
  }
}

function handleDeferredCommand(command, args, { stdout, stderr }) {
  const parsed = parseCommandOptions(args, {
    flags: [
      "--json",
      "--examples",
      "--packages",
      "--adapters",
      "--strict",
      "--force"
    ],
    valueOptions: ["--input"],
    maxPositionals: command === "instructions" || command === "init" ? 1 : 0
  });

  const error = {
    code: "not_implemented",
    message: `The "${command}" command is defined in help but is implemented by another work slice.`
  };

  if (parsed.json) {
    writeJson(stdout, {
      command,
      ok: false,
      errors: [error]
    });
  } else {
    stderr.write(`${error.code}: ${error.message}\n`);
  }

  return EXIT_CODES.runtime;
}

async function loadCompiler(env) {
  const modulePath = env.SPEC_UI_COMPILER_MODULE || "../compiler.js";
  return import(modulePath);
}

async function writeArtifact(path, contents) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, "utf8");
}
