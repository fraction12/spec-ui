import { normalizeCliError, normalizeErrors } from "./options.js";

export function writeJson(stream, value) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function writeError({ stdout, stderr, json, command, error }) {
  const payload = {
    command,
    ok: false,
    errors: [normalizeCliError(error)]
  };

  if (json) {
    writeJson(stdout, payload);
    return;
  }

  stderr.write(`${JSON.stringify({ errors: payload.errors }, null, 2)}\n`);
}

export function statusToJson(result) {
  const errors = normalizeErrors(result.errors ?? []);

  return {
    command: result.command,
    ok: result.readiness === "ready",
    input: result.input,
    sourceMode: result.input.sourceMode,
    ...(result.input.path ? { inputPath: result.input.path } : {}),
    readiness: result.readiness,
    ...(result.title ? { title: result.title } : {}),
    ...(result.adapter ? { adapter: result.adapter } : {}),
    ...(result.prototypeTarget ? { prototypeTarget: result.prototypeTarget } : {}),
    roles: result.roles,
    includes: result.includes,
    includedFiles: result.includedFiles,
    missingIncludes: result.missingIncludes,
    acceptance: result.acceptance,
    errors,
    validationErrors: errors,
    warnings: result.warnings ?? []
  };
}

export function formatStatusHuman(result) {
  const lines = [
    `Prototype: ${result.title || "(untitled)"}`,
    `Source: ${result.input.sourceMode}`,
    result.adapter?.target ? `Adapter: ${result.adapter.target}` : null,
    result.prototypeTarget?.target ? `Target: ${result.prototypeTarget.target}` : null,
    `Readiness: ${result.readiness}`,
    ""
  ].filter((line) => line !== null);

  if (result.includes) {
    lines.push(
      `Includes: ${result.includes.resolved}/${result.includes.total} resolved`
    );
  }

  if (result.acceptance) {
    lines.push(
      `Acceptance: ${result.acceptance.invariantCount ?? 0} invariants, ${result.acceptance.noteCount ?? 0} notes`
    );
  }

  if (result.roles?.length) {
    lines.push("");
    for (const role of result.roles) {
      const marker = role.status === "resolved" ? "[x]" : "[!]";
      const optional = role.required ? "" : " optional";
      lines.push(`${marker} ${role.path.padEnd(16)} ${role.role}${optional}`);
    }
  }

  if (result.errors?.length) {
    lines.push("");
    for (const error of normalizeErrors(result.errors)) {
      lines.push(`[!] ${error.code}`);
      lines.push(`    ${error.message}`);
      if (error.path) {
        lines.push(`    Source: ${error.path}${error.line ? `:${error.line}` : ""}`);
      }
    }
  }

  lines.push("");
  lines.push(result.readiness === "ready" ? "Ready to compile." : "Fix the reported issues before compiling.");

  return `${lines.join("\n")}\n`;
}
