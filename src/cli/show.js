import {
  cliExitCode,
  createCliError,
  createListResult,
  inspectInput,
  normalizeCliError
} from "./resources.js";

export async function runListCommand(args, io = process) {
  try {
    const parsed = parseListArgs(args);
    const result = await createListResult({
      filter: parsed.filter,
      cwd: io.cwd ?? process.cwd()
    });
    writeOutput(io.stdout, parsed.json ? result : formatList(result, parsed.filter));
    return 0;
  } catch (error) {
    return writeCommandError(io, "list", error, args.includes("--json"));
  }
}

export async function runShowCommand(args, io = process) {
  try {
    const parsed = parseShowArgs(args);
    const result = await inspectInput(parsed.input, {
      command: "show",
      cwd: io.cwd ?? process.cwd()
    });
    writeOutput(io.stdout, parsed.json ? { command: "show", ...result } : formatShow(result));
    return result.readiness === "ready" ? 0 : 1;
  } catch (error) {
    return writeCommandError(io, "show", error, args.includes("--json"));
  }
}

function parseListArgs(args) {
  const parsed = {
    json: false,
    filter: "default"
  };
  const filters = new Map([
    ["--examples", "examples"],
    ["--packages", "packages"],
    ["--adapters", "adapters"]
  ]);

  for (const arg of args) {
    if (arg === "--json") {
      parsed.json = true;
      continue;
    }
    if (filters.has(arg)) {
      if (parsed.filter !== "default") {
        throw createCliError("list", "unknown_option", "Only one list filter may be provided.", {
          option: arg,
          exitCode: 2
        });
      }
      parsed.filter = filters.get(arg);
      continue;
    }
    throw createCliError("list", "unknown_option", `Unknown option "${arg}".`, {
      option: arg,
      exitCode: 2
    });
  }

  return parsed;
}

function parseShowArgs(args) {
  const parsed = {
    input: null,
    json: false
  };

  for (const arg of args) {
    if (arg === "--json") {
      parsed.json = true;
      continue;
    }
    if (arg.startsWith("--")) {
      throw createCliError("show", "unknown_option", `Unknown option "${arg}".`, {
        option: arg,
        exitCode: 2
      });
    }
    if (parsed.input) {
      throw createCliError("show", "unknown_option", `Unexpected argument "${arg}".`, {
        argument: arg,
        exitCode: 2
      });
    }
    parsed.input = arg;
  }

  if (!parsed.input) {
    throw createCliError("show", "missing_input", "show requires an input.", { exitCode: 2 });
  }

  return parsed;
}

function formatList(result, filter) {
  const sections = [];

  if (filter === "default" || filter === "examples") {
    sections.push("Examples:");
    if (result.examples.length === 0) {
      sections.push("No built-in examples found.");
    } else {
      for (const example of result.examples) {
        sections.push(`- ${example.name} (${example.sourceMode}) ${example.path}`);
      }
    }
  }

  if (filter === "default" || filter === "packages") {
    if (sections.length) sections.push("");
    sections.push("Packages:");
    if (result.packages.length === 0) {
      sections.push("No configured packages found.");
    } else {
      for (const item of result.packages) {
        sections.push(`- ${item.name} (${item.sourceMode}) ${item.path}`);
      }
    }
  }

  if (filter === "adapters") {
    sections.push("Adapters:");
    for (const adapter of result.adapters) {
      const library = adapter.resolvedLibrary
        ? ` library=${adapter.resolvedLibrary.name}@${adapter.resolvedLibrary.version}`
        : "";
      const provenance = adapter.assetProvenance
        ? ` provenance=${adapter.assetProvenance.mode}:${adapter.assetProvenance.source}`
        : "";
      sections.push(`- ${adapter.target} version=${adapter.version} resolved=${adapter.resolvedTarget}${library}${provenance}`);
    }
  }

  return `${sections.join("\n")}\n`;
}

function formatShow(result) {
  const lines = [
    `Prototype: ${result.title || "(untitled)"}`,
    `Source: ${result.sourceMode}`,
    `Input: ${result.input.path}`,
    `Adapter: ${result.adapter?.target ?? "(none)"}`,
    `Readiness: ${result.readiness}`
  ];

  if (result.manifestPath) lines.push(`Manifest: ${result.manifestPath}`);
  if (result.surface) lines.push(`Surface: ${result.surface}`);
  if (result.target) lines.push(`Target: ${result.target}`);
  if (result.fidelity) lines.push(`Fidelity: ${result.fidelity}`);

  lines.push(`Acceptance: ${result.acceptance.invariantCount} invariants, ${result.acceptance.noteCount} notes`);

  if (result.includes.length > 0) {
    lines.push("", "Includes:");
    for (const include of result.includes) {
      const required = include.required ? "required" : "optional";
      lines.push(`- ${include.path} role=${include.role} ${required} status=${include.status}`);
    }
  }

  if (result.errors.length > 0) {
    lines.push("", "Errors:");
    for (const error of result.errors) {
      const location = [error.sourceFile, error.line].filter(Boolean).join(":");
      lines.push(`- ${error.code}: ${error.message}${location ? ` (${location})` : ""}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function writeCommandError(io, command, error, json) {
  const body = normalizeCliError(error, command);
  if (json) {
    writeOutput(io.stdout, body);
  } else {
    const lines = body.errors.map((item) => `${item.code}: ${item.message}`);
    writeOutput(io.stderr, `${lines.join("\n")}\n`);
  }
  return cliExitCode(error);
}

function writeOutput(stream, value) {
  if (typeof value === "string") {
    stream.write(value);
    return;
  }
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}
