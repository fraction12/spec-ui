import { createHash } from "node:crypto";
import { basename, dirname, isAbsolute, normalize, relative, resolve, sep } from "node:path";

import { parseSpec } from "./parser.js";
import { validateSource } from "./validation.js";
import { SPEC_UI_VERSION } from "./contracts.js";

const DEFAULT_RENDERING_TARGET = "baseline";
const DEFAULT_PACKAGE_RENDERING_TARGET = "bootstrap-html";
const SUPPORTED_RENDERING_TARGETS = new Set([
  DEFAULT_RENDERING_TARGET,
  DEFAULT_PACKAGE_RENDERING_TARGET
]);
const SUPPORTED_PACKAGE_ROLES = new Set([
  "screens",
  "flows",
  "content",
  "layout",
  "tokens",
  "acceptance"
]);
const MANIFEST_RE = /^# Prototype:\s*(.+?)\s*$/;
const FLOW_RE = /^## Flow:\s*(.+?)\s*$/;
const CONTENT_RE = /^## Content:\s*(.+?)\s*$/;
const LAYOUT_RE = /^## Layout:\s*(.+?)\s*$/;
const TOKENS_RE = /^## Tokens:\s*(.+?)\s*$/;
const CONTROL_RE = /^-\s*Control:\s*(.+?)\s*$/;
const FLOW_STEP_RE = /^-\s*Step:\s*(.+?)\s*$/;
const CONTENT_ITEM_RE = /^-\s*([A-Za-z][A-Za-z0-9 -]*):\s*(.+?)\s*$/;
const TOKEN_RE = /^-\s*(Tone|Radius|Density|Treatment):\s*(.+?)\s*$/;
const INVARIANT_RE = /^-\s*Invariant:\s*(.+?)\s*$/;
const NOTE_RE = /^-\s*Note:\s*(.+?)\s*$/;
const INCLUDE_RE = /^-\s*([^\[]+?)(?:\s*(\[[^\]]*\]))?\s*$/;

const ADAPTER_REGISTRY = {
  baseline: {
    target: "baseline",
    version: SPEC_UI_VERSION,
    resolvedTarget: "baseline",
    resolvedLibrary: {
      name: "spec-ui-baseline",
      version: SPEC_UI_VERSION
    },
    assetProvenance: {
      mode: "inline",
      source: "spec-ui-render-html"
    }
  },
  "bootstrap-html": {
    target: "bootstrap-html",
    version: SPEC_UI_VERSION,
    resolvedTarget: "bootstrap-html",
    resolvedLibrary: {
      name: "bootstrap",
      version: "5"
    },
    assetProvenance: {
      mode: "vendored",
      source: "bootstrap-5"
    }
  }
};

const LAYOUT_CONTROL_VALUES = {
  gap: new Set(["none", "xs", "sm", "md", "lg", "xl"]),
  padding: new Set(["none", "xs", "sm", "md", "lg", "xl"]),
  density: new Set(["compact", "comfortable", "spacious"]),
  width: new Set(["narrow", "content", "wide", "full"]),
  align: new Set(["start", "center", "end", "stretch"]),
  columns: new Set(["1", "2", "3", "4"]),
  collapse: new Set(["none", "stack", "wrap", "drawer", "tabs"]),
  collapseAt: new Set(["mobile", "tablet", "desktop"]),
  text: new Set(["wrap", "nowrap", "truncate", "balance"]),
  overflow: new Set(["visible", "contain", "scroll", "clip"])
};

const TOKEN_VALUES = {
  tone: new Set(["blue", "green", "red", "amber", "neutral", "slate", "violet"]),
  radius: new Set(["none", "sm", "md", "lg", "pill"]),
  density: new Set(["compact", "comfortable", "spacious"]),
  treatment: new Set(["flat", "outlined", "elevated", "filled"])
};

export class CompilationError extends Error {
  constructor(errors) {
    super("Spec UI compilation failed.");
    this.name = "CompilationError";
    this.errors = errors;
  }
}

export function compileToIr(markdown, options = {}) {
  const source = parseSpec(markdown, options);
  const errors = validateSource(source, options).filter((error) =>
    error.code !== "unsupported_adapter" ||
    !SUPPORTED_RENDERING_TARGETS.has(source?.adapter)
  );

  if (errors.length > 0) {
    throw new CompilationError(errors);
  }

  return compileSourceToIr(source, markdown, options);
}

export function compileSourceToIr(source, markdown = "", options = {}) {
  if (source?.sourceMode === "package") {
    return compileParsedPackageSourceToIr(source, markdown, options);
  }

  const renderingTarget = resolveRenderingTarget(source, options);
  const adapter = resolveAdapterMetadata(renderingTarget);

  return {
    version: SPEC_UI_VERSION,
    title: source.title,
    metadata: {
      generatedBy: "spec-ui",
      sourceMode: "single-file",
      sourceHash: createHash("sha256").update(markdown).digest("hex"),
      compiledAt: options.compiledAt ?? null,
      surface: resolveSurface(source),
      renderingTarget,
      adapter: adapter.adapter,
      resolvedLibrary: adapter.resolvedLibrary,
      assetProvenance: adapter.assetProvenance
    },
    screens: (source.screens ?? []).map(compileScreen)
  };
}

export function parsePackageManifest(markdown, options = {}) {
  const manifestPath = options.manifestPath ?? "prototype.md";
  const packageRoot = options.packageRoot ?? dirname(manifestPath);
  const lines = String(markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
  const errors = [];
  const firstContent = lines.findIndex((line) => line.trim() !== "");
  const manifest = {
    title: "",
    surface: "app",
    adapter: undefined,
    target: "standalone-html",
    fidelity: "prototype",
    manifestPath,
    packageRoot,
    line: firstContent >= 0 ? firstContent + 1 : 1,
    includes: [],
    errors
  };

  if (firstContent < 0) {
    errors.push({
      code: "missing_package_manifest",
      message: 'Package manifest must start with "# Prototype: <title>".',
      line: 1,
      sourceFile: manifestPath
    });
    return manifest;
  }

  const heading = parseHeading(lines[firstContent].trim(), MANIFEST_RE);
  if (!heading) {
    errors.push({
      code: "missing_package_manifest",
      message: 'Package manifest must start with "# Prototype: <title>".',
      line: firstContent + 1,
      sourceFile: manifestPath
    });
  } else {
    manifest.title = heading.title;
    manifest.surface = heading.attrs.surface ?? manifest.surface;
    manifest.adapter = heading.attrs.adapter;
    manifest.target = heading.attrs.target ?? manifest.target;
    manifest.fidelity = heading.attrs.fidelity ?? manifest.fidelity;
  }

  let inIncludes = false;
  for (let index = firstContent + 1; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index].trim();
    if (line === "") continue;
    if (/^Includes:\s*$/.test(line)) {
      inIncludes = true;
      continue;
    }
    if (inIncludes && line.startsWith("#")) {
      inIncludes = false;
      continue;
    }
    if (!inIncludes) continue;

    const include = line.match(INCLUDE_RE);
    if (!include) continue;

    const includePath = include[1].trim();
    const attrs = include[2] ? parseAttrs(include[2]) : {};
    const role = attrs.role ?? inferRole(includePath);
    const required = attrs.required === undefined ? true : attrs.required !== "false";
    const containment = resolvePackageInclude(packageRoot, includePath);

    manifest.includes.push({
      path: includePath,
      role,
      required,
      order: manifest.includes.length,
      line: lineNumber,
      manifestPath,
      sourceFile: manifestPath,
      absolutePath: containment.absolutePath,
      insideRoot: containment.insideRoot
    });

    if (!containment.insideRoot) {
      errors.push({
        code: "package_include_outside_root",
        message: `Package include "${includePath}" must stay inside the package root.`,
        line: lineNumber,
        sourceFile: manifestPath
      });
    }

    if (!SUPPORTED_PACKAGE_ROLES.has(role)) {
      errors.push({
        code: "unsupported_package_role",
        message: `Unsupported package role "${role}".`,
        line: lineNumber,
        sourceFile: manifestPath
      });
    }
  }

  return manifest;
}

export function compilePackageToIr(packageInput, options = {}) {
  const prepared = preparePackageSource(packageInput, options);

  if (prepared.errors.length > 0) {
    throw new CompilationError(prepared.errors);
  }

  const validationErrors = validateSource(prepared.source, options).filter((error) =>
    error.code !== "unsupported_adapter"
  );
  const packageErrors = validatePackageModel(prepared);
  const errors = [...validationErrors, ...packageErrors];

  if (errors.length > 0) {
    throw new CompilationError(errors);
  }

  return compilePackageSourceToIr(prepared, options);
}

export function getPackageStatus(packageInput, options = {}) {
  const prepared = preparePackageSource(packageInput, options);
  const validationErrors = prepared.source
    ? validateSource(prepared.source, options).filter((error) =>
        error.code !== "unsupported_adapter"
      )
    : [];
  const errors = [
    ...prepared.errors,
    ...validationErrors,
    ...(prepared.source ? validatePackageModel(prepared) : [])
  ];
  const missingIncludes = prepared.includedFiles.filter((file) =>
    file.required && !file.exists
  );
  const readiness = errors.length === 0
    ? "ready"
    : missingIncludes.length > 0 ||
        errors.some((error) => error.code.startsWith("unresolved_"))
      ? "blocked"
      : "invalid";

  return {
    sourceMode: "package",
    title: prepared.manifest.title,
    manifestPath: prepared.manifest.manifestPath,
    adapter: prepared.adapterTarget,
    fidelity: prepared.manifest.fidelity,
    includedFiles: prepared.includedFiles,
    missingIncludes,
    validationErrors: errors,
    acceptance: summarizeAcceptance(prepared.acceptance),
    readiness
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
    ...layoutControls(screen),
    ...sourceRef(screen),
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
    ...layoutControls(region),
    ...sourceRef(region),
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
    ...layoutControls(block),
    ...sourceRef(block),
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
    ...sourceRef(section),
    elements,
    actions: [...elementActions, ...(section.actions ?? []).map(compileAction)]
  };
}

function compileState(state) {
  return {
    id: state.id,
    type: state.type,
    label: state.label,
    ...sourceRef(state),
    items: state.items.map((item) => compileElement(item, { inlineAction: true }))
  };
}

function compileElement(element, options = {}) {
  const action = readAction(element);
  const compiled = {
    id: element.id,
    type: element.type,
    label: element.label,
    props: normalizeProps(element),
    ...sourceRef(element)
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
    target: action.target ?? action.attrs?.target ?? "",
    ...sourceRef(action)
  };
}

function compileElementAction(element) {
  const action = readAction(element);

  return {
    id: element.id,
    label: element.label,
    type: action.type,
    target: action.target,
    ...sourceRef(element)
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

function compilePackageSourceToIr(prepared, options) {
  const renderingTarget = resolveRenderingTarget(prepared.source, {
    ...options,
    adapter: options.adapter,
    defaultRenderingTarget: DEFAULT_PACKAGE_RENDERING_TARGET
  });
  const adapter = resolveAdapterMetadata(renderingTarget);
  const acceptanceSummary = summarizeAcceptance(prepared.acceptance);

  return {
    version: SPEC_UI_VERSION,
    title: prepared.manifest.title,
    metadata: {
      generatedBy: "spec-ui",
      sourceMode: "package",
      sourceHash: prepared.sourceHash,
      compiledAt: options.compiledAt ?? null,
      surface: prepared.manifest.surface,
      package: {
        title: prepared.manifest.title,
        manifestPath: prepared.manifest.manifestPath,
        fidelity: prepared.manifest.fidelity,
        target: prepared.manifest.target,
        includedFiles: prepared.includedFiles
      },
      renderingTarget,
      adapter: adapter.adapter,
      resolvedLibrary: adapter.resolvedLibrary,
      assetProvenance: adapter.assetProvenance,
      acceptanceSummary
    },
    screens: (prepared.source.screens ?? []).map(compileScreen),
    flows: prepared.flows.map(compileFlow),
    contentRecords: prepared.contentRecords.map(compileContentRecord),
    layoutControls: prepared.layoutControls.map(compileLayoutDeclaration),
    tokens: prepared.tokens.map(compileTokenGroup),
    acceptance: prepared.acceptance
  };
}

function preparePackageSource(packageInput, options = {}) {
  const manifestPath = packageInput.manifestPath ?? "prototype.md";
  const packageRoot = packageInput.packageRoot ?? dirname(manifestPath);
  const manifestMarkdown = packageInput.manifestMarkdown ?? packageInput.markdown ?? "";
  const manifest = parsePackageManifest(manifestMarkdown, {
    manifestPath,
    packageRoot
  });
  const filesByPath = new Map(
    (packageInput.files ?? []).map((file) => [
      normalizePackagePath(file.path ?? file.sourceFile ?? ""),
      file
    ])
  );
  const errors = [...manifest.errors];
  const includedFiles = [];
  const roleMarkdown = {
    screens: "",
    flows: "",
    content: "",
    layout: "",
    tokens: "",
    acceptance: ""
  };

  for (const include of manifest.includes) {
    const normalizedPath = normalizePackagePath(include.path);
    const file = filesByPath.get(normalizedPath);
    const exists = typeof file?.contents === "string" || typeof file?.markdown === "string";
    const contents = file?.contents ?? file?.markdown ?? "";

    includedFiles.push({
      path: include.path,
      role: include.role,
      required: include.required,
      exists,
      order: include.order,
      sourceHash: exists ? createHash("sha256").update(contents).digest("hex") : null,
      sourceFile: include.path,
      manifestLine: include.line
    });

    if (!exists && include.required && include.insideRoot) {
      errors.push({
        code: "missing_package_include",
        message: `Required package include "${include.path}" was not found.`,
        line: include.line,
        sourceFile: manifestPath
      });
      continue;
    }

    if (exists && SUPPORTED_PACKAGE_ROLES.has(include.role)) {
      roleMarkdown[include.role] += `${contents.replace(/\r\n?/g, "\n")}\n`;
    }
  }

  const specHeader = `# Spec: ${manifest.title || "Prototype"} [surface="${manifest.surface}"]`;
  const source = parseSpec(`${specHeader}\n${roleMarkdown.screens}`, options);
  source.title = manifest.title;
  source.surface = manifest.surface;
  source.attrs = { surface: manifest.surface };
  source.adapter = manifest.adapter;
  source.line = manifest.line;
  annotateSourceTree(source, manifest.includes.filter((include) => include.role === "screens"));

  const parsed = {
    flows: parseFlows(roleMarkdown.flows, manifest),
    contentRecords: parseContent(roleMarkdown.content, manifest),
    layoutControls: parseLayout(roleMarkdown.layout, manifest),
    tokens: parseTokens(roleMarkdown.tokens, manifest),
    acceptance: parseAcceptance(roleMarkdown.acceptance, manifest)
  };

  for (const records of Object.values(parsed)) {
    errors.push(...collectParseErrors(records));
  }

  resolveContentReferences(source, parsed.contentRecords);
  applyLayoutControls(source, parsed.layoutControls);

  const adapterTarget =
    options.adapter ??
    manifest.adapter ??
    DEFAULT_PACKAGE_RENDERING_TARGET;

  return {
    manifest,
    manifestMarkdown,
    includedFiles,
    source,
    sourceHash: hashPackageSource(manifestMarkdown, manifest.includes, filesByPath),
    adapterTarget,
    errors,
    ...parsed
  };
}

function parseFlows(markdown, manifest) {
  const records = [];
  let current = null;

  forEachMarkdownLine(markdown, (line, lineNumber) => {
    const flow = parseHeading(line, FLOW_RE);
    if (flow) {
      current = {
        id: flow.attrs.id ?? "",
        title: flow.title,
        start: flow.attrs.start ?? "",
        steps: [],
        source: sourceFor(manifest, "flows", lineNumber)
      };
      records.push(current);
      return;
    }

    const step = parseListHeading(line, FLOW_STEP_RE);
    if (step && current) {
      current.steps.push({
        label: step.title,
        from: step.attrs.from ?? "",
        action: step.attrs.action ?? "",
        to: step.attrs.to ?? "",
        source: sourceFor(manifest, "flows", lineNumber)
      });
    }
  });

  return records;
}

function parseContent(markdown, manifest) {
  const records = [];
  let current = null;

  forEachMarkdownLine(markdown, (line, lineNumber) => {
    const content = parseHeading(line, CONTENT_RE);
    if (content) {
      current = {
        id: content.attrs.id ?? "",
        title: content.title,
        type: content.attrs.type ?? "copy",
        items: [],
        source: sourceFor(manifest, "content", lineNumber)
      };
      records.push(current);
      return;
    }

    const item = line.match(CONTENT_ITEM_RE);
    if (item && current) {
      const { text, attrs } = extractAttrs(item[2]);
      current.items.push({
        id: `${current.id}-${slugify(text)}`,
        type: contentItemType(item[1], current.type),
        label: text,
        props: normalizeProps({ props: attrs }),
        source: sourceFor(manifest, "content", lineNumber)
      });
    }
  });

  return records;
}

function parseLayout(markdown, manifest) {
  const records = [];
  let current = null;

  forEachMarkdownLine(markdown, (line, lineNumber) => {
    const layout = parseHeading(line, LAYOUT_RE);
    if (layout) {
      current = {
        title: layout.title,
        target: layout.attrs.target ?? "",
        controls: [],
        source: sourceFor(manifest, "layout", lineNumber),
        errors: []
      };
      records.push(current);
      return;
    }

    const control = parseListHeading(line, CONTROL_RE);
    if (control && current) {
      const name = control.title;
      const value = control.attrs.value ?? "";
      const normalizedName = name === "collapse" && control.attrs.at ? "collapse" : name;
      current.controls.push({
        name: normalizedName,
        value,
        attrs: normalizeControlAttrs(control.attrs),
        source: sourceFor(manifest, "layout", lineNumber)
      });
    }
  });

  return records;
}

function parseTokens(markdown, manifest) {
  const groups = [];
  let current = null;

  forEachMarkdownLine(markdown, (line, lineNumber) => {
    const group = parseHeading(line, TOKENS_RE);
    if (group) {
      current = {
        id: group.attrs.id ?? slugify(group.title),
        title: group.title,
        controls: [],
        source: sourceFor(manifest, "tokens", lineNumber)
      };
      groups.push(current);
      return;
    }

    const token = line.match(TOKEN_RE);
    if (token && current) {
      const { text, attrs } = extractAttrs(token[2]);
      current.controls.push({
        type: token[1].toLowerCase(),
        target: text,
        value: attrs.value ?? "",
        source: sourceFor(manifest, "tokens", lineNumber)
      });
    }
  });

  return groups;
}

function parseAcceptance(markdown, manifest) {
  const invariants = [];
  const notes = [];

  forEachMarkdownLine(markdown, (line, lineNumber) => {
    const invariant = parseListHeading(line, INVARIANT_RE);
    if (invariant) {
      invariants.push({
        name: invariant.title,
        target: invariant.attrs.target ?? "",
        source: sourceFor(manifest, "acceptance", lineNumber)
      });
      return;
    }

    const note = line.match(NOTE_RE);
    if (note) {
      notes.push({
        text: note[1].trim(),
        source: sourceFor(manifest, "acceptance", lineNumber)
      });
    }
  });

  return { invariants, notes };
}

function validatePackageModel(prepared) {
  const errors = [];
  const ids = collectSemanticIds(prepared.source);
  const allIds = new Map();
  const flowIds = new Set(prepared.flows.map((flow) => flow.id).filter(Boolean));
  const contentIds = new Set(prepared.contentRecords.map((record) => record.id).filter(Boolean));

  if (!SUPPORTED_RENDERING_TARGETS.has(prepared.adapterTarget)) {
    errors.push({
      code: "unsupported_adapter",
      message: `Unsupported adapter "${prepared.adapterTarget}".`,
      line: prepared.manifest.line,
      sourceFile: prepared.manifest.manifestPath
    });
  }

  for (const declaration of prepared.layoutControls) {
    const target = parseTarget(declaration.target);
    if (!target || !ids.has(target.id)) {
      errors.push({
        code: "unresolved_layout_target",
        message: `Layout target "${declaration.target}" does not match a screen, region, or block id.`,
        ...sourceError(declaration.source)
      });
    }

    for (const control of declaration.controls) {
      validateLayoutControl(errors, control);
    }
  }

  for (const group of prepared.tokens) {
    for (const control of group.controls) {
      validateTokenControl(errors, control);
    }
  }

  for (const [id, source] of collectSemanticTargets(prepared.source)) {
    const targetId = id.split(":")[1];
    collectPackageId(errors, allIds, targetId, sourceObject(source));
  }

  for (const flow of prepared.flows) {
    collectPackageId(errors, allIds, flow.id, flow.source);
  }

  for (const record of prepared.contentRecords) {
    collectPackageId(errors, allIds, record.id, record.source);
    for (const item of record.items ?? []) {
      collectPackageId(errors, allIds, item.id, item.source);
    }
  }

  for (const group of prepared.tokens) {
    collectPackageId(errors, allIds, group.id, group.source);
  }

  for (const contentRef of collectContentRefs(prepared.source)) {
    if (!contentIds.has(contentRef.id)) {
      errors.push({
        code: "unresolved_content_reference",
        message: `Content reference "${contentRef.id}" does not match a package content record.`,
        ...sourceError(contentRef.source)
      });
    }
  }

  for (const flow of prepared.flows) {
    if (flow.start && !ids.has(flow.start)) {
      errors.push({
        code: "unresolved_flow_target",
        message: `Flow start "${flow.start}" does not match a known screen, block, or state id.`,
        ...sourceError(flow.source)
      });
    }
    for (const step of flow.steps) {
      if ((step.from && !ids.has(step.from)) || (step.to && !ids.has(step.to))) {
        errors.push({
          code: "unresolved_flow_target",
          message: `Flow step "${step.label}" references an unknown source or target.`,
          ...sourceError(step.source)
        });
      }
    }
  }

  for (const invariant of prepared.acceptance.invariants) {
    const target = parseTarget(invariant.target);
    if (target?.kind === "flow" && !flowIds.has(target.id)) {
      errors.push({
        code: "unresolved_flow_target",
        message: `Acceptance invariant target "${invariant.target}" does not match a flow id.`,
        ...sourceError(invariant.source)
      });
    } else if (target && target.id !== "*" && target.kind !== "flow" && !ids.has(target.id)) {
      errors.push({
        code: "unresolved_layout_target",
        message: `Acceptance invariant target "${invariant.target}" does not match a known source id.`,
        ...sourceError(invariant.source)
      });
    }
  }

  return errors;
}

function collectPackageId(errors, ids, id, source) {
  if (!id) return;

  if (ids.has(id)) {
    errors.push({
      code: "duplicate_package_id",
      message: `Duplicate package id "${id}".`,
      ...sourceError(source)
    });
    return;
  }

  ids.set(id, source);
}

function compileFlow(flow) {
  return {
    id: flow.id,
    title: flow.title,
    start: flow.start,
    source: flow.source ?? sourceObject(flow),
    steps: flow.steps.map((step) => ({
      label: step.label,
      from: step.from,
      action: step.action,
      to: step.to,
      source: step.source ?? sourceObject(step)
    }))
  };
}

function compileContentRecord(record) {
  return {
    id: record.id,
    title: record.title,
    type: record.type,
    source: record.source,
    items: record.items
  };
}

function compileLayoutDeclaration(declaration) {
  return {
    title: declaration.title,
    target: declaration.target,
    source: declaration.source,
    controls: declaration.controls.map((control) => ({
      name: control.name,
      value: control.value,
      attrs: control.attrs,
      source: control.source
    }))
  };
}

function compileTokenGroup(group) {
  return {
    id: group.id,
    title: group.title,
    source: group.source,
    controls: group.controls
  };
}

function resolveContentReferences(source, contentRecords) {
  const recordsById = new Map(contentRecords.map((record) => [record.id, record]));

  for (const block of walkBlocks(source)) {
    const ref = block.attrs?.content ?? block.attrs?.contentRef;
    if (!ref) continue;

    block.contentRef = ref;
    const record = recordsById.get(ref);
    if (!record) continue;

    block.items.push(...record.items.map((item) => ({
      ...item,
      id: `${block.id}-${item.id}`,
      props: { ...item.props },
      source: item.source
    })));
  }
}

function applyLayoutControls(source, declarations) {
  const targets = collectSemanticTargets(source);

  for (const declaration of declarations) {
    const target = parseTarget(declaration.target);
    if (!target) continue;
    const node = targets.get(`${target.kind}:${target.id}`);
    if (!node) continue;

    node.layout = Object.fromEntries(
      declaration.controls.map((control) => [
        control.name,
        control.attrs.at
          ? { value: control.value, at: control.attrs.at }
          : control.value
      ])
    );
  }
}

function layoutControls(node) {
  return node.layout ? { layout: node.layout } : {};
}

function sourceRef(node) {
  if (node.source) return { source: node.source };
  if (node.sourceFile || node.sourceRole) {
    return {
      source: {
        file: node.sourceFile ?? "",
        role: node.sourceRole ?? "",
        line: node.sourceLine ?? node.line
      }
    };
  }
  return {};
}

function resolveAdapterMetadata(renderingTarget) {
  const registryEntry = ADAPTER_REGISTRY[renderingTarget.target];
  if (!registryEntry?.assetProvenance) {
    throw new CompilationError([
      {
        code: "adapter_asset_provenance_unknown",
        message: `Asset provenance for adapter "${renderingTarget.target}" is unknown.`
      }
    ]);
  }

  return {
    adapter: {
      target: registryEntry.target,
      version: registryEntry.version,
      resolvedTarget: registryEntry.resolvedTarget
    },
    resolvedLibrary: registryEntry.resolvedLibrary,
    assetProvenance: registryEntry.assetProvenance
  };
}

function compileParsedPackageSourceToIr(source, markdown, options = {}) {
  const packageSource = structuredClone(source);
  const contentRecords = normalizeParsedContentRecords(packageSource.contentRecords ?? []);
  const layoutControls = normalizeParsedLayout(packageSource.layout ?? []);
  const tokens = normalizeParsedTokens(packageSource.tokens ?? []);
  const acceptance = normalizeParsedAcceptance(packageSource.acceptance);
  resolveContentReferences(packageSource, contentRecords);
  applyLayoutControls(packageSource, layoutControls);

  const renderingTarget = resolveRenderingTarget(packageSource, {
    ...options,
    adapter: options.adapter,
    defaultRenderingTarget: DEFAULT_PACKAGE_RENDERING_TARGET
  });
  const adapter = resolveAdapterMetadata(renderingTarget);
  const acceptanceSummary = summarizeAcceptance(acceptance);
  const includedFiles = (packageSource.package?.includes ?? []).map((include, index) => ({
    path: include.path,
    role: include.role,
    required: include.required,
    exists: include.exists === true,
    order: index,
    sourceHash: null,
    sourceFile: include.sourceFile ?? "prototype.md",
    manifestLine: include.line
  }));

  return {
    version: SPEC_UI_VERSION,
    title: packageSource.title,
    metadata: {
      generatedBy: "spec-ui",
      sourceMode: "package",
      sourceHash: createHash("sha256").update(markdown || stableStringify(packageSource)).digest("hex"),
      compiledAt: options.compiledAt ?? null,
      surface: packageSource.surface ?? resolveSurface(packageSource),
      package: {
        title: packageSource.title,
        manifestPath: packageSource.package?.manifestPath ?? null,
        fidelity: packageSource.fidelity ?? packageSource.attrs?.fidelity ?? "prototype",
        target: packageSource.target ?? packageSource.attrs?.target ?? "standalone-html",
        includedFiles
      },
      renderingTarget,
      adapter: adapter.adapter,
      resolvedLibrary: adapter.resolvedLibrary,
      assetProvenance: adapter.assetProvenance,
      acceptanceSummary
    },
    screens: (packageSource.screens ?? []).map(compileScreen),
    flows: (packageSource.flows ?? []).map(compileFlow),
    contentRecords: contentRecords.map(compileContentRecord),
    layoutControls: layoutControls.map(compileLayoutDeclaration),
    tokens: tokens.map(compileTokenGroup),
    acceptance
  };
}

function normalizeParsedContentRecords(records) {
  return records.map((record) => ({
    id: record.id,
    title: record.title,
    type: record.type,
    source: sourceObject(record),
    items: (record.items ?? record.records ?? []).map((item) => ({
      id: item.id ?? `${record.id}-${slugify(item.label)}`,
      type: item.type ?? contentItemType(item.kind ?? "Item", record.type),
      label: item.label,
      props: normalizeProps({ props: item.props ?? item.attrs ?? {} }),
      source: sourceObject(item)
    }))
  }));
}

function normalizeParsedLayout(records) {
  return records.map((record) => ({
    title: record.title,
    target: record.target,
    source: sourceObject(record),
    controls: (record.controls ?? []).map((control) => ({
      name: control.name,
      value: control.value ?? control.attrs?.value ?? "",
      attrs: normalizeControlAttrs(control.attrs ?? {}),
      source: sourceObject(control)
    }))
  }));
}

function normalizeParsedTokens(groups) {
  return groups.map((group) => ({
    id: group.id,
    title: group.title,
    source: sourceObject(group),
    controls: (group.controls ?? []).map((control) => ({
      type: control.type ?? control.name,
      target: control.target,
      value: control.value ?? control.attrs?.value ?? "",
      source: sourceObject(control)
    }))
  }));
}

function normalizeParsedAcceptance(acceptance = {}) {
  return {
    invariants: (acceptance.invariants ?? []).map((invariant) => ({
      name: invariant.name,
      target: invariant.target,
      source: sourceObject(invariant)
    })),
    notes: (acceptance.notes ?? []).map((note) => ({
      text: note.text ?? note.name ?? "",
      source: sourceObject(note)
    }))
  };
}

function sourceObject(node) {
  return node.source ?? {
    file: node.sourceFile ?? "",
    role: node.sourceRole ?? "",
    line: node.sourceLine ?? node.line
  };
}

function parseHeading(line, regex) {
  const match = line.match(regex);
  if (!match) return null;
  const { text, attrs } = extractAttrs(match[1]);
  return { title: text, attrs };
}

function parseListHeading(line, regex) {
  return parseHeading(line, regex);
}

function extractAttrs(value) {
  const attrMatch = value.match(/^(.*?)\s*(\[[^\]]*\])\s*$/);
  if (!attrMatch) {
    return {
      text: value.trim(),
      attrs: {}
    };
  }

  return {
    text: attrMatch[1].trim(),
    attrs: parseAttrs(attrMatch[2])
  };
}

function parseAttrs(block) {
  const inner = block.slice(1, -1).trim();
  const attrs = {};

  for (const match of inner.matchAll(/([A-Za-z][A-Za-z0-9_-]*)="([^"]*)"/g)) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

function resolvePackageInclude(packageRoot, includePath) {
  if (isAbsolute(includePath)) {
    return {
      absolutePath: includePath,
      insideRoot: false
    };
  }

  const absoluteRoot = resolve(packageRoot);
  const absolutePath = resolve(absoluteRoot, includePath);
  const relativePath = relative(absoluteRoot, absolutePath);

  return {
    absolutePath,
    insideRoot: relativePath === "" ||
      (!relativePath.startsWith("..") && !isAbsolute(relativePath))
  };
}

function inferRole(includePath) {
  const name = basename(includePath).replace(/\.md$/i, "");
  return SUPPORTED_PACKAGE_ROLES.has(name) ? name : name;
}

function normalizePackagePath(value) {
  return normalize(value).split(sep).join("/");
}

function annotateSourceTree(source, screenIncludes) {
  const include = screenIncludes[0];
  if (!include) return;
  const base = {
    file: include.path,
    role: include.role
  };

  for (const screen of source.screens ?? []) {
    annotateNode(screen, base, -1);
    for (const region of screen.regions ?? []) {
      annotateNode(region, base, -1);
      for (const block of region.blocks ?? []) {
        annotateBlockTree(block, base);
      }
    }
    for (const section of screen.sections ?? []) {
      annotateNode(section, base, -1);
      for (const element of section.elements ?? []) annotateNode(element, base, -1);
      for (const action of section.actions ?? []) annotateNode(action, base, -1);
      for (const block of section.blocks ?? []) annotateBlockTree(block, base);
    }
    for (const state of screen.states ?? []) {
      annotateStateTree(state, base);
    }
  }
}

function annotateBlockTree(block, base) {
  annotateNode(block, base, -1);
  for (const item of block.items ?? []) annotateNode(item, base, -1);
  for (const action of block.actions ?? []) annotateNode(action, base, -1);
  for (const state of block.states ?? []) annotateStateTree(state, base);
}

function annotateStateTree(state, base) {
  annotateNode(state, base, -1);
  for (const item of state.items ?? []) annotateNode(item, base, -1);
  for (const action of state.actions ?? []) annotateNode(action, base, -1);
}

function annotateNode(node, base, offset) {
  if (!node || typeof node.line !== "number") return;
  node.source = {
    ...base,
    line: Math.max(1, node.line + offset)
  };
}

function sourceFor(manifest, role, line) {
  const include = manifest.includes.find((item) => item.role === role);
  return {
    file: include?.path ?? `${role}.md`,
    role,
    line
  };
}

function forEachMarkdownLine(markdown, callback) {
  String(markdown ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (line) callback(line, index + 1);
    });
}

function collectParseErrors(records) {
  if (!records) return [];
  if (Array.isArray(records)) {
    return records.flatMap((record) => record.errors ?? []);
  }
  return records.errors ?? [];
}

function contentItemType(label, recordType) {
  const normalized = slugify(label);
  if (normalized === "row" || recordType === "table-rows") return "row";
  if (normalized === "metric" || recordType === "metrics") return "metric";
  if (normalized === "faq" || recordType === "faq") return "faq-item";
  if (normalized === "testimonial" || recordType === "testimonials") return "testimonial";
  if (normalized === "tier" || recordType === "pricing") return "pricing-tier";
  if (normalized === "feature" || recordType === "features") return "feature";
  return "text";
}

function normalizeControlAttrs(attrs) {
  const normalized = { ...attrs };
  if (normalized.at && !normalized.collapseAt) {
    normalized.collapseAt = normalized.at;
  }
  return Object.fromEntries(Object.keys(normalized).sort().map((key) => [key, normalized[key]]));
}

function validateLayoutControl(errors, control) {
  const allowed = LAYOUT_CONTROL_VALUES[control.name];
  if (!allowed || !allowed.has(String(control.value))) {
    errors.push({
      code: "unsupported_layout_control",
      message: `Unsupported layout control "${control.name}" with value "${control.value}".`,
      ...sourceError(control.source)
    });
  }

  if (
    control.attrs.collapseAt &&
    !LAYOUT_CONTROL_VALUES.collapseAt.has(String(control.attrs.collapseAt))
  ) {
    errors.push({
      code: "unsupported_layout_control",
      message: `Unsupported collapse breakpoint "${control.attrs.collapseAt}".`,
      ...sourceError(control.source)
    });
  }
}

function validateTokenControl(errors, control) {
  const allowed = TOKEN_VALUES[control.type];
  if (!allowed || !allowed.has(String(control.value))) {
    errors.push({
      code: "unsupported_token_control",
      message: `Unsupported token control "${control.type}" with value "${control.value}".`,
      ...sourceError(control.source)
    });
  }
}

function collectSemanticIds(source) {
  const ids = new Set();
  for (const [key] of collectSemanticTargets(source)) {
    ids.add(key.split(":")[1]);
  }
  return ids;
}

function collectSemanticTargets(source) {
  const targets = new Map();
  for (const screen of source.screens ?? []) {
    if (screen.id) targets.set(`screen:${screen.id}`, screen);
    for (const region of screen.regions ?? []) {
      if (region.id) targets.set(`region:${region.id}`, region);
      for (const block of region.blocks ?? []) {
        addBlockTargets(targets, block);
      }
    }
    for (const section of screen.sections ?? []) {
      if (section.id) targets.set(`section:${section.id}`, section);
      for (const block of section.blocks ?? []) {
        addBlockTargets(targets, block);
      }
    }
    for (const state of screen.states ?? []) {
      if (state.id) targets.set(`state:${state.id}`, state);
    }
  }
  return targets;
}

function addBlockTargets(targets, block) {
  if (block.id) targets.set(`block:${block.id}`, block);
  for (const item of block.items ?? []) {
    if (item.id) targets.set(`item:${item.id}`, item);
  }
  for (const state of block.states ?? []) {
    if (state.id) targets.set(`state:${state.id}`, state);
  }
}

function walkBlocks(source) {
  const blocks = [];
  for (const screen of source.screens ?? []) {
    for (const region of screen.regions ?? []) {
      blocks.push(...(region.blocks ?? []));
    }
    for (const section of screen.sections ?? []) {
      blocks.push(...(section.blocks ?? []));
    }
  }
  return blocks;
}

function collectContentRefs(source) {
  return walkBlocks(source)
    .filter((block) => block.contentRef || block.attrs?.content || block.attrs?.contentRef)
    .map((block) => ({
      id: block.contentRef ?? block.attrs.content ?? block.attrs.contentRef,
      source: block.source
    }));
}

function parseTarget(value) {
  const match = String(value ?? "").match(/^([a-z]+):(.+)$/);
  if (!match) return null;
  return {
    kind: match[1],
    id: match[2]
  };
}

function sourceError(source) {
  return {
    line: source?.line,
    sourceFile: source?.file
  };
}

function summarizeAcceptance(acceptance) {
  const invariants = acceptance?.invariants ?? [];
  const notes = acceptance?.notes ?? [];
  return {
    invariantCount: invariants.length,
    noteCount: notes.length,
    invariants: invariants.map((invariant) => ({
      name: invariant.name,
      target: invariant.target,
      source: invariant.source
    }))
  };
}

function hashPackageSource(manifestMarkdown, includes, filesByPath) {
  const payload = {
    manifest: manifestMarkdown,
    files: includes.map((include) => {
      const file = filesByPath.get(normalizePackagePath(include.path));
      return {
        path: include.path,
        role: include.role,
        required: include.required,
        contents: file?.contents ?? file?.markdown ?? null
      };
    })
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
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

function slugify(value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "item";
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
  const target = optionTarget ??
    sourceTarget ??
    options.defaultRenderingTarget ??
    DEFAULT_RENDERING_TARGET;
  const selectionSource = optionTarget
    ? "options"
    : sourceTarget
      ? "source"
      : "default";

  if (!SUPPORTED_RENDERING_TARGETS.has(target)) {
    throw new CompilationError([
      {
        code: "unsupported_rendering_target",
        message: `Unsupported rendering target "${target}". Supported targets: baseline, bootstrap-html.`,
        line: source?.line ?? 1
      }
    ]);
  }

  const registryEntry = ADAPTER_REGISTRY[target];

  return {
    target,
    version: SPEC_UI_VERSION,
    resolvedTarget: registryEntry.resolvedTarget,
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
