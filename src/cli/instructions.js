import {
  ROLE_ORDER,
  cliExitCode,
  createCliError,
  inspectInput,
  loadLocalInstructions,
  normalizeCliError,
  supportedInstructionMetadata
} from "./resources.js";

export async function runInstructionsCommand(args, io = process) {
  try {
    const parsed = parseInstructionsArgs(args);
    const result = await createInstructionsResult({
      ...parsed,
      cwd: io.cwd ?? process.cwd()
    });
    writeOutput(io.stdout, parsed.json ? result : formatInstructions(result));
    return 0;
  } catch (error) {
    return writeCommandError(io, "instructions", error, args.includes("--json"));
  }
}

export async function createInstructionsResult({ role, input, cwd = process.cwd() }) {
  const metadata = supportedInstructionMetadata();
  if (role && !ROLE_ORDER.includes(role)) {
    throw createCliError("instructions", "unsupported_role", `Unsupported role "${role}".`, {
      role,
      suggestions: ROLE_ORDER,
      exitCode: 2
    });
  }

  const inspected = await inspectInput(input, { command: "instructions", cwd });
  const localInstructions = await loadLocalInstructions({ command: "instructions", cwd });
  const roles = role ? [role] : ROLE_ORDER;
  const roleFiles = Object.fromEntries(
    roles.map((item) => [item, roleFileFor(inspected, item)])
  );

  return {
    command: "instructions",
    ok: true,
    role: role ?? null,
    supportedRoles: ROLE_ORDER,
    input: inspected.input,
    readiness: inspected.readiness,
    package: {
      title: inspected.title,
      sourceMode: inspected.sourceMode,
      manifestPath: inspected.manifestPath,
      target: inspected.target,
      adapter: inspected.adapter?.target ?? null,
      errors: inspected.errors.map((error) => ({
        code: error.code,
        message: error.message,
        ...(error.sourceFile ? { sourceFile: error.sourceFile } : {}),
        ...(error.line ? { line: error.line } : {})
      }))
    },
    roleFile: role ? roleFiles[role] : null,
    roleFiles,
    instructions: roles.map((item) => roleInstructions(item, metadata)),
    supportedControls: metadata.controls,
    localInstructions
  };
}

function parseInstructionsArgs(args) {
  const parsed = {
    role: null,
    input: null,
    json: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") {
      parsed.json = true;
      continue;
    }
    if (arg === "--input") {
      parsed.input = args[index + 1];
      index += 1;
      if (!parsed.input || parsed.input.startsWith("--")) {
        throw createCliError("instructions", "missing_input", "instructions requires --input <input>.", {
          exitCode: 2
        });
      }
      continue;
    }
    if (arg.startsWith("--")) {
      throw createCliError("instructions", "unknown_option", `Unknown option "${arg}".`, {
        option: arg,
        exitCode: 2
      });
    }
    if (parsed.role) {
      throw createCliError("instructions", "unknown_option", `Unexpected argument "${arg}".`, {
        argument: arg,
        exitCode: 2
      });
    }
    parsed.role = arg;
  }

  if (!parsed.input) {
    throw createCliError("instructions", "missing_input", "instructions requires --input <input>.", {
      exitCode: 2
    });
  }

  if (parsed.role && !ROLE_ORDER.includes(parsed.role)) {
    throw createCliError("instructions", "unsupported_role", `Unsupported role "${parsed.role}".`, {
      role: parsed.role,
      suggestions: ROLE_ORDER,
      exitCode: 2
    });
  }

  return parsed;
}

function roleInstructions(role, metadata) {
  const common = [
    "Edit only the role file named for this role when the package has one.",
    "Use supported Spec UI semantic grammar and keep implementation details out of source files.",
    "Do not add raw markup, scripts, style declarations, framework component names, or library class names.",
    "Keep acceptance evidence and unrelated role changes out of this edit unless the user asks for them."
  ];

  const byRole = {
    screens: [
      `Use supported screen kinds: ${metadata.controls.screens.screenKinds.join(", ")}.`,
      `Compose screens from semantic regions and blocks, including: ${metadata.controls.screens.regions.join(", ")}.`,
      "Keep navigation labels stable and make primary actions point to reachable screens or states.",
      "Model loading, empty, error, modal, drawer, and confirmation states semantically when they matter."
    ],
    flows: [
      `Use supported flow actions: ${metadata.controls.flows.actions.join(", ")}.`,
      "Start each flow from a known screen and keep every step target reachable.",
      "Describe user intent and state transitions, not event-handler or router implementation details."
    ],
    content: [
      "Attach content records to semantic ids used by screens and layout.",
      "Keep labels, table headings, empty states, success states, error states, and filter copy explicit.",
      "Use concise product copy that can be rendered by any adapter."
    ],
    layout: [
      `Use symbolic gap values only: ${metadata.controls.layout.gaps.join(", ")}.`,
      "Set wrapping expectations with text and collapse controls so compact viewports remain readable.",
      "Align modal/dialog, drawer, and confirmation states to the triggering screen or block and keep one active stack.",
      "Represent filters and navigation as semantic blocks with stable labels and clear targets.",
      "Contain overflow for nested cards, tables, and side panels instead of letting content spill into adjacent regions.",
      `Use supported layout controls: ${Object.keys(metadata.controls.layout.controls).join(", ")}.`
    ],
    tokens: [
      `Use supported token controls: ${Object.keys(metadata.controls.tokens.controls).join(", ")}.`,
      "Define tone, density, radius, and treatment intent with portable values.",
      "Keep brand and state colors semantic so the adapter can map them consistently."
    ],
    acceptance: [
      `Use supported invariants when possible: ${metadata.controls.acceptance.invariants.join(", ")}.`,
      "Capture UAT feedback as invariants or notes that can be checked before compile.",
      "Call out reachable flows, stable labels, modal stack behavior, and overflow containment."
    ]
  };

  return {
    role,
    file: `${role}.md`,
    guidance: [...common, ...byRole[role]]
  };
}

function roleFileFor(inspected, role) {
  if (inspected.sourceMode !== "package") {
    return null;
  }

  const include = inspected.roles.find((item) => item.role === role);
  if (!include) {
    return null;
  }
  if (include.status === "blocked" || isUnsafeIncludePath(include.path)) {
    return null;
  }

  return {
    role,
    path: `${inspected.input.path}/${include.path}`,
    required: include.required,
    status: include.status
  };
}

function isUnsafeIncludePath(includePath) {
  return includePath.startsWith("/") ||
    includePath.split(/[\\/]+/).some((segment) => segment === "..");
}

function formatInstructions(result) {
  const lines = [
    `Prototype: ${result.package.title || "(untitled)"}`,
    `Source: ${result.input.sourceMode}`,
    `Readiness: ${result.readiness}`
  ];

  if (result.role) {
    lines.push(`Role: ${result.role}`);
    lines.push(`Role file: ${result.roleFile?.path ?? "(not found)"}`);
  } else {
    lines.push(`Roles: ${result.supportedRoles.join(", ")}`);
  }

  for (const section of result.instructions) {
    lines.push("", `${section.role}:`);
    for (const item of section.guidance) {
      lines.push(`- ${item}`);
    }
  }

  if (result.localInstructions) {
    lines.push("", `Local instructions: ${result.localInstructions.path}`, result.localInstructions.content.trimEnd());
  }

  return `${lines.join("\n")}\n`;
}

function writeCommandError(io, command, error, json) {
  const body = normalizeCliError(error, command);
  if (json) {
    writeOutput(io.stdout, body);
  } else {
    const lines = body.errors.map((item) => `${item.code}: ${item.message}`);
    if (body.errors[0]?.suggestions) {
      lines.push(`Supported roles: ${body.errors[0].suggestions.join(", ")}`);
    }
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
