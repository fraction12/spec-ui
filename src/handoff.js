import { createHash } from "node:crypto";

export function createHandoffResult({
  inputPath,
  outputPath,
  irPath,
  html,
  ir,
  warnings = []
}) {
  return {
    artifactPath: outputPath,
    ...(irPath ? { irPath } : {}),
    ...(inputPath ? { inputPath } : {}),
    sourceHash: createSourceHash({ html, ir }),
    sourceMode: ir?.metadata?.sourceMode ?? "single-file",
    ...(ir?.metadata?.package ? { package: ir.metadata.package } : {}),
    renderingTarget: normalizeRenderingTarget(ir?.metadata?.renderingTarget),
    adapter: normalizeAdapter(ir?.metadata?.adapter),
    resolvedLibrary: normalizeResolvedLibrary(ir?.metadata?.resolvedLibrary),
    assetProvenance: normalizeAssetProvenance(ir?.metadata?.assetProvenance),
    ...(ir?.metadata?.acceptanceSummary
      ? { acceptanceSummary: ir.metadata.acceptanceSummary }
      : {}),
    ...(ir?.metadata?.sourceMode === "package"
      ? { packageReadiness: createPackageReadiness(ir) }
      : {}),
    viewerCompatibility: ["browser", "microcanvas"],
    warnings: Array.isArray(warnings) ? warnings : []
  };
}

function createSourceHash({ html, ir }) {
  if (typeof ir?.metadata?.sourceHash === "string") {
    return ir.metadata.sourceHash;
  }

  const source = ir === undefined ? String(html ?? "") : stableStringify(ir);
  return createHash("sha256").update(source).digest("hex");
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function normalizeRenderingTarget(renderingTarget) {
  return {
    target: renderingTarget?.target ?? "baseline",
    version: renderingTarget?.version ?? "0.1.0",
    resolvedTarget: renderingTarget?.resolvedTarget ?? "baseline",
    selectionSource: renderingTarget?.selectionSource ?? "default"
  };
}

function normalizeAdapter(adapter) {
  return {
    target: adapter?.target ?? "baseline",
    version: adapter?.version ?? "0.1.0",
    resolvedTarget: adapter?.resolvedTarget ?? "baseline"
  };
}

function normalizeResolvedLibrary(resolvedLibrary) {
  return {
    name: resolvedLibrary?.name ?? "spec-ui-baseline",
    version: resolvedLibrary?.version ?? "0.1.0"
  };
}

function normalizeAssetProvenance(assetProvenance) {
  return {
    mode: assetProvenance?.mode ?? "inline",
    source: assetProvenance?.source ?? "spec-ui-render-html"
  };
}

function createPackageReadiness(ir) {
  const includedFiles = ir?.metadata?.package?.includedFiles ?? [];
  const missingIncludes = includedFiles.filter((file) =>
    file.required && !file.exists
  );

  return {
    readiness: missingIncludes.length > 0 ? "blocked" : "ready",
    includedFiles,
    missingIncludes,
    acceptance: ir?.metadata?.acceptanceSummary ?? {
      invariantCount: 0,
      noteCount: 0,
      invariants: []
    }
  };
}
