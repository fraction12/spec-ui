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
    renderingTarget: normalizeRenderingTarget(ir?.metadata?.renderingTarget),
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
