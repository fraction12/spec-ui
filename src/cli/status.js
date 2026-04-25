import { normalizeErrors } from "./options.js";

export async function createStatusResult({ command = "status", input, compiler }) {
  if (input.sourceMode === "package") {
    return createPackageStatusResult({ command, input, compiler });
  }

  return createSingleFileStatusResult({ command, input, compiler });
}

function createPackageStatusResult({ command, input, compiler }) {
  const status = compiler.getPackageStatus(input.packageInput);
  const errors = normalizeErrors(status.validationErrors ?? []);
  const includedFiles = status.includedFiles ?? [];
  const missingIncludes = status.missingIncludes ?? [];
  const manifest = input.packageInput.manifest ?? {};

  return {
    command,
    input: {
      raw: input.raw,
      path: input.path,
      manifestPath: status.manifestPath ?? input.manifestPath,
      sourceMode: "package"
    },
    title: status.title,
    readiness: status.readiness,
    adapter: adapterObject(status.adapter),
    prototypeTarget: { target: manifest.target ?? "standalone-html" },
    roles: includedFiles.map((file) => ({
      role: file.role,
      path: file.path,
      required: file.required !== false,
      status: file.exists ? "resolved" : "missing"
    })),
    includes: {
      total: includedFiles.length,
      resolved: includedFiles.filter((file) => file.exists).length,
      missing: missingIncludes.length
    },
    includedFiles,
    missingIncludes,
    acceptance: normalizeAcceptance(status.acceptance),
    errors,
    warnings: []
  };
}

function createSingleFileStatusResult({ command, input, compiler }) {
  try {
    const ir = compiler.compileToIr(input.markdown);
    return {
      command,
      input: {
        raw: input.raw,
        path: input.path,
        sourceMode: "single-file"
      },
      title: ir.title,
      readiness: "ready",
      adapter: adapterObject(ir?.metadata?.adapter?.target ?? ir?.metadata?.renderingTarget?.target),
      prototypeTarget: null,
      roles: [],
      includes: null,
      includedFiles: [],
      missingIncludes: [],
      acceptance: { invariantCount: 0, noteCount: 0, invariants: [] },
      errors: [],
      warnings: ir?.warnings ?? []
    };
  } catch (error) {
    return {
      command,
      input: {
        raw: input.raw,
        path: input.path,
        sourceMode: "single-file"
      },
      title: "",
      readiness: "invalid",
      adapter: null,
      prototypeTarget: null,
      roles: [],
      includes: null,
      includedFiles: [],
      missingIncludes: [],
      acceptance: { invariantCount: 0, noteCount: 0, invariants: [] },
      errors: normalizeErrors(error),
      warnings: []
    };
  }
}

function adapterObject(adapter) {
  if (!adapter) return null;
  if (typeof adapter === "object") return adapter;
  return {
    target: adapter,
    version: "0.1.0",
    resolvedTarget: adapter
  };
}

function normalizeAcceptance(acceptance) {
  if (!acceptance) {
    return { invariantCount: 0, noteCount: 0, invariants: [] };
  }

  return {
    invariantCount: acceptance.invariantCount ?? acceptance.invariants ?? 0,
    noteCount: acceptance.noteCount ?? acceptance.notes ?? 0,
    ...(Array.isArray(acceptance.invariants)
      ? { invariants: acceptance.invariants }
      : {})
  };
}
