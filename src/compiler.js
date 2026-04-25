import { createHash } from "node:crypto";

import { parseSpec } from "./parser.js";
import { validateSource } from "./validation.js";
import { SPEC_UI_VERSION } from "./contracts.js";

const DEFAULT_RENDERING_TARGET = "baseline";
const SUPPORTED_RENDERING_TARGETS = new Set([DEFAULT_RENDERING_TARGET]);

export class CompilationError extends Error {
  constructor(errors) {
    super("Spec UI compilation failed.");
    this.name = "CompilationError";
    this.errors = errors;
  }
}

export function compileToIr(markdown, options = {}) {
  const source = parseSpec(markdown, options);
  const errors = validateSource(source, options);

  if (errors.length > 0) {
    throw new CompilationError(errors);
  }

  return compileSourceToIr(source, markdown, options);
}

export function compileSourceToIr(source, markdown = "", options = {}) {
  const renderingTarget = resolveRenderingTarget(source, options);

  return {
    version: SPEC_UI_VERSION,
    title: source.title,
    metadata: {
      generatedBy: "spec-ui",
      sourceHash: createHash("sha256").update(markdown).digest("hex"),
      compiledAt: options.compiledAt ?? null,
      surface: resolveSurface(source),
      renderingTarget
    },
    screens: (source.screens ?? []).map(compileScreen)
  };
}

export function serializeIr(ir) {
  return `${JSON.stringify(ir, null, 2)}\n`;
}

function compileScreen(screen) {
  const regions = screen.regions ?? [];

  return {
    id: screen.id,
    title: screen.title,
    shell: screen.shell ?? screen.attrs?.shell ?? "none",
    kind: screen.kind ?? screen.attrs?.kind ?? "default",
    ...layoutGap(screen),
    regions: regions.map(compileRegion),
    sections: (screen.sections ?? []).map(compileSection),
    states: (screen.states ?? []).map(compileState)
  };
}

function compileRegion(region) {
  return {
    id: region.id,
    title: region.title,
    type: region.type ?? region.attrs?.type ?? "content",
    ...layoutGap(region),
    blocks: (region.blocks ?? []).map(compileBlock)
  };
}

function compileBlock(block) {
  const items = (block.items ?? []).map(compileElement);
  const itemActions = (block.items ?? [])
    .filter((item) => readAction(item))
    .map((item) => compileElementAction(item));

  return {
    id: block.id,
    title: block.title,
    type: block.type ?? block.attrs?.type ?? "state-panel",
    variant: block.variant ?? block.attrs?.variant ?? null,
    ...layoutGap(block),
    items,
    actions: [...itemActions, ...(block.actions ?? []).map(compileAction)],
    states: (block.states ?? []).map(compileState)
  };
}

function layoutGap(node) {
  const gap = node.gap ?? node.attrs?.gap;
  return gap ? { gap } : {};
}

function compileSection(section) {
  const elements = (section.elements ?? []).map(compileElement);
  const elementActions = (section.elements ?? [])
    .filter((element) => readAction(element))
    .map(compileElementAction);

  return {
    id: section.id,
    title: section.title,
    elements,
    actions: [...elementActions, ...(section.actions ?? []).map(compileAction)]
  };
}

function compileState(state) {
  return {
    id: state.id,
    type: state.type,
    label: state.label,
    items: state.items.map((item) => compileElement(item, { inlineAction: true }))
  };
}

function compileElement(element, options = {}) {
  const action = readAction(element);
  const compiled = {
    id: element.id,
    type: element.type,
    label: element.label,
    props: normalizeProps(element)
  };

  if (action) {
    compiled.action = options.inlineAction
      ? {
          id: element.id,
          label: element.label,
          type: action.type,
          target: action.target
        }
      : element.id;
  }

  return compiled;
}

function compileAction(action) {
  return {
    id: action.id,
    label: action.label,
    type: action.type ?? action.attrs?.type ?? "",
    target: action.target ?? action.attrs?.target ?? ""
  };
}

function compileElementAction(element) {
  const action = readAction(element);

  return {
    id: element.id,
    label: element.label,
    type: action.type,
    target: action.target
  };
}

function normalizeProps(node) {
  const props = node.props ?? Object.fromEntries(
    Object.entries(node.attrs ?? {}).filter(([key]) => key !== "action")
  );

  return Object.fromEntries(
    Object.keys(props)
      .sort()
      .map((key) => [key, props[key]])
  );
}

function readAction(node) {
  if (node.action && typeof node.action === "object") {
    return {
      type: node.action.type ?? "",
      target: node.action.target ?? ""
    };
  }

  if (typeof node.action === "string") {
    return parseActionValue(node.action);
  }

  if (typeof node.attrs?.action === "string") {
    return parseActionValue(node.attrs.action);
  }

  return null;
}

function parseActionValue(value) {
  const [type, ...targetParts] = String(value).split(":");

  return {
    type: type ?? "",
    target: targetParts.join(":")
  };
}

function resolveRenderingTarget(source, options) {
  const optionTarget = readOptionRenderingTarget(options);
  const sourceTarget = readSourceRenderingTarget(source);
  const target = optionTarget ?? sourceTarget ?? DEFAULT_RENDERING_TARGET;
  const selectionSource = optionTarget
    ? "options"
    : sourceTarget
      ? "source"
      : "default";

  if (!SUPPORTED_RENDERING_TARGETS.has(target)) {
    throw new CompilationError([
      {
        code: "unsupported_rendering_target",
        message: `Unsupported rendering target "${target}". Only "baseline" is supported.`,
        line: source?.line ?? 1
      }
    ]);
  }

  return {
    target,
    version: SPEC_UI_VERSION,
    resolvedTarget: DEFAULT_RENDERING_TARGET,
    selectionSource
  };
}

function readOptionRenderingTarget(options) {
  if (typeof options.renderingTarget === "string") return options.renderingTarget;
  if (typeof options.renderingTarget?.target === "string") {
    return options.renderingTarget.target;
  }
  if (typeof options.adapter === "string") return options.adapter;
  if (typeof options.target === "string") return options.target;
  return null;
}

function readSourceRenderingTarget(source) {
  if (typeof source?.attrs?.adapter === "string") return source.attrs.adapter;
  if (typeof source?.adapter === "string") return source.adapter;
  if (typeof source?.metadata?.adapter === "string") return source.metadata.adapter;
  if (typeof source?.renderingTarget?.target === "string") {
    return source.renderingTarget.target;
  }
  return null;
}

function resolveSurface(source) {
  if (typeof source?.attrs?.surface === "string") return source.attrs.surface;
  if (typeof source?.surface === "string") return source.surface;
  if ((source?.screens ?? []).some((screen) => screen.shell === "marketing")) {
    return "marketing";
  }
  return "app";
}
