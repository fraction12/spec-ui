export const EXIT_CODES = Object.freeze({
  ok: 0,
  runtime: 1,
  usage: 2
});

export class CliError extends Error {
  constructor(error, exitCode = EXIT_CODES.runtime) {
    super(error?.message || "CLI command failed.");
    this.name = "CliError";
    this.error = normalizeCliError(error);
    this.exitCode = exitCode;
  }
}

export function usageError(error) {
  return new CliError(error, EXIT_CODES.usage);
}

export function runtimeError(error) {
  return new CliError(error, EXIT_CODES.runtime);
}

export function parseCommandOptions(args, spec = {}) {
  const flags = new Set(spec.flags ?? []);
  const valueOptions = new Set(spec.valueOptions ?? []);
  const maxPositionals = spec.maxPositionals ?? Infinity;
  const minPositionals = spec.minPositionals ?? 0;
  const values = {};
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") {
      positionals.push(...args.slice(index + 1));
      break;
    }

    if (arg.startsWith("--")) {
      const [name, inlineValue] = arg.split("=", 2);

      if (flags.has(name)) {
        if (inlineValue !== undefined) {
          throw usageError({
            code: "unexpected_option_value",
            message: `Option "${name}" does not accept a value.`
          });
        }
        values[name] = true;
        continue;
      }

      if (valueOptions.has(name)) {
        const value = inlineValue ?? args[index + 1];
        if (!value || (inlineValue === undefined && value.startsWith("--"))) {
          throw usageError({
            code: "missing_option_value",
            message: `Option "${name}" requires a value.`
          });
        }
        values[name] = value;
        if (inlineValue === undefined) index += 1;
        continue;
      }

      throw usageError({
        code: "unknown_option",
        message: `Unknown option "${name}".`
      });
    }

    positionals.push(arg);
  }

  if (positionals.length < minPositionals) {
    throw usageError({
      code: spec.missingCode ?? "missing_argument",
      message: spec.missingMessage ?? "A required argument is missing."
    });
  }

  if (positionals.length > maxPositionals) {
    throw usageError({
      code: "unexpected_argument",
      message: `Unexpected argument "${positionals[maxPositionals]}".`
    });
  }

  return {
    positionals,
    values,
    json: values["--json"] === true,
    help: values["--help"] === true
  };
}

export function normalizeCliError(error) {
  if (error?.error) return normalizeCliError(error.error);
  return {
    code: error?.code || "command_failed",
    message: error?.message || "Command failed.",
    ...(error?.path ? { path: error.path } : {}),
    ...(error?.line ? { line: error.line } : {}),
    ...(error?.candidates ? { candidates: error.candidates } : {}),
    ...(error?.supported ? { supported: error.supported } : {})
  };
}

export function normalizeErrors(error) {
  const errors = Array.isArray(error?.errors)
    ? error.errors
    : Array.isArray(error)
      ? error
      : [error];

  return errors.map((item) => ({
    code: item?.code || "command_failed",
    message: item?.message || "Command failed.",
    ...(item?.path || item?.sourceFile ? { path: item.path || item.sourceFile } : {}),
    ...(item?.line ? { line: item.line } : {}),
    ...(item?.id ? { id: item.id } : {})
  }));
}
