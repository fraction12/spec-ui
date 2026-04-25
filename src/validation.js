import {
  ACTION_TYPES,
  ADAPTER_TARGETS,
  APP_BLOCK_TYPES,
  APP_REGION_TYPES,
  APP_SCREEN_KINDS,
  BLOCK_TYPES,
  BLOCK_VARIANTS,
  ELEMENT_TYPES,
  GAP_VALUES,
  IMPLEMENTATION_DETAIL_PATTERN,
  ITEM_TYPES,
  LAYOUT_CONTROL_VALUES,
  MARKETING_BLOCK_TYPES,
  MARKETING_REGION_TYPES,
  MARKETING_SCREEN_KINDS,
  PACKAGE_FLOW_ACTION_TYPES,
  PACKAGE_ROLES,
  REGION_TYPES,
  SCREEN_KINDS,
  SHELLS,
  STATE_TYPES,
  SURFACES,
  TOKEN_CONTROL_VALUES
} from "./contracts.js";

const SCREEN_ACTIONS = new Set(["navigate"]);
const STATE_ACTIONS = new Set(["open-modal", "close-modal", "show-state", "set-tab", "toggle"]);

export function validateSource(source) {
  const errors = [];
  const parseErrors = source?.errors ?? [];
  const packageMode = source?.sourceMode === "package";

  errors.push(...parseErrors.filter((error) => error.code !== "raw_html"));

  if (!source?.title && !packageMode && !hasError(errors, "missing_spec_title")) {
    errors.push({
      code: "missing_spec_title",
      message: 'First non-empty line must be "# Spec: <title>".',
      line: source?.line ?? 1
    });
  }

  validateSpecAttrs(errors, source);
  if (packageMode) validatePackageManifest(errors, source);

  if (
    !source?.screens?.length &&
    (!packageMode || !hasAnyError(errors, [
      "missing_package_manifest",
      "missing_package_include",
      "package_include_outside_root"
    ]))
  ) {
    errors.push({
      code: "no_screens",
      message: "Spec must include at least one screen.",
      line: source?.line ?? 1
    });
  }

  const ids = new Map();
  const screenIds = new Set();
  const stateIds = new Set();

  for (const screen of source?.screens ?? []) {
    if (screen.id) screenIds.add(screen.id);
    for (const state of screen.states ?? []) {
      if (state.id) stateIds.add(state.id);
    }
    for (const state of getBlockStates(screen)) {
      if (state.id) stateIds.add(state.id);
    }
  }

  for (const screen of source?.screens ?? []) {
    requireId(errors, screen, "screen");
    validateScreen(errors, source, screen);
    collectId(errors, ids, screen, { packageMode });

    for (const region of screen.regions ?? []) {
      requireId(errors, region, "region");
      validateRegion(errors, source, screen, region);
      collectId(errors, ids, region, { packageMode });

      for (const block of region.blocks ?? []) {
        validateBlockAndChildren(errors, ids, source, screen, block, screenIds, stateIds, { packageMode });
      }
    }

    for (const section of screen.sections ?? []) {
      requireId(errors, section, "section");
      validateImplementationAttrs(errors, section.attrs, section.line);
      collectId(errors, ids, section, { packageMode });

      for (const element of section.elements ?? []) {
        requireId(errors, element, "element");
        validateElement(errors, element, screenIds, stateIds);
        collectId(errors, ids, element, { packageMode });
      }

      for (const action of section.actions ?? []) {
        requireId(errors, action, "action");
        validateAction(errors, action, screenIds, stateIds);
        collectId(errors, ids, action, { packageMode });
      }

      for (const block of section.blocks ?? []) {
        validateBlockAndChildren(errors, ids, source, screen, block, screenIds, stateIds, { packageMode });
      }
    }

    for (const state of screen.states ?? []) {
      requireId(errors, state, "state");
      collectId(errors, ids, state, { packageMode });
      if (!STATE_TYPES.has(state.type)) {
        errors.push({
          code: "unsupported_state_type",
          message: `Unsupported state type "${state.type}".`,
          line: state.line
        });
      }
      validateImplementationAttrs(errors, state.attrs, state.line);

      for (const item of state.items ?? []) {
        requireId(errors, item, "element");
        if (item.type === undefined || item.props !== undefined) {
          validateElement(errors, item, screenIds, stateIds);
        } else {
          validateAction(errors, item, screenIds, stateIds);
        }
        collectId(errors, ids, item, { packageMode });
      }
    }
  }

  if (packageMode) {
    validatePackageReferences(errors, source, ids);
  }

  errors.push(...parseErrors.filter((error) => error.code === "raw_html"));
  return errors;
}

export function getPackageStatus(source) {
  const errors = validateSource(source);
  const blockingCodes = new Set([
    "missing_package_include",
    "unresolved_content_reference",
    "unresolved_layout_target",
    "unresolved_flow_target"
  ]);
  const readiness = errors.length === 0
    ? "ready"
    : errors.some((error) => blockingCodes.has(error.code))
      ? "blocked"
      : "invalid";

  return {
    sourceMode: source?.sourceMode ?? "single-file",
    title: source?.title ?? "",
    manifestPath: source?.package?.manifestPath ?? null,
    adapter: source?.adapter ?? source?.attrs?.adapter ?? null,
    fidelity: source?.fidelity ?? null,
    includedFiles: (source?.package?.includes ?? []).map((include) => ({
      path: include.path,
      role: include.role,
      required: include.required,
      exists: include.exists === true,
      parseStatus: include.parseStatus ?? "pending",
      sourceFile: include.sourceFile,
      line: include.line
    })),
    missingIncludes: errors
      .filter((error) => error.code === "missing_package_include")
      .map((error) => error.path),
    validationErrors: errors,
    acceptanceInvariantCount: source?.acceptance?.invariants?.length ?? 0,
    readiness
  };
}

function validatePackageManifest(errors, source) {
  for (const include of source?.package?.includes ?? []) {
    if (!PACKAGE_ROLES.has(include.role)) {
      errors.push({
        code: "unsupported_package_role",
        message: `Unsupported package role "${include.role}".`,
        line: include.line,
        sourceFile: include.sourceFile,
        path: include.path
      });
    }

    if (include.outsideRoot) {
      errors.push({
        code: "package_include_outside_root",
        message: `Package include "${include.path}" must stay inside the package root.`,
        line: include.line,
        sourceFile: include.sourceFile,
        path: include.path
      });
    }

    if (include.required && include.exists === false && !include.outsideRoot) {
      errors.push({
        code: "missing_package_include",
        message: `Required package include "${include.path}" was not found.`,
        line: include.line,
        sourceFile: include.sourceFile,
        path: include.path
      });
    }
  }

  const provenance = source?.attrs?.assetProvenance;
  if (provenance && !["inline", "vendored"].includes(provenance)) {
    errors.push({
      code: "adapter_asset_provenance_unknown",
      message: `Adapter asset provenance "${provenance}" is not traceable.`,
      line: source.line
    });
  }
}

function validatePackageReferences(errors, source, ids) {
  const index = collectReferenceIndex(source);
  const packageMode = true;

  for (const flow of source.flows ?? []) {
    requirePackageId(errors, flow, "flow");
    collectId(errors, ids, flow, { packageMode });

    if (flow.start && !index.screens.has(flow.start)) {
      unresolvedFlowTarget(errors, flow, flow.start);
    }

    for (const step of flow.steps ?? []) {
      validateFlowStep(errors, step, index);
    }
  }

  for (const record of source.contentRecords ?? []) {
    requirePackageId(errors, record, "content record");
    collectId(errors, ids, record, { packageMode });
  }

  for (const block of getAllBlocks(source)) {
    const contentRef = block.attrs?.content ?? block.attrs?.contentRef ?? block.attrs?.contentRecord;
    if (contentRef && !index.content.has(contentRef)) {
      errors.push({
        code: "unresolved_content_reference",
        message: `Content record "${contentRef}" is not declared in the package.`,
        line: block.line,
        sourceFile: block.sourceFile
      });
    }
  }

  for (const layout of source.layout ?? []) {
    validateLayoutTarget(errors, layout, index);
    for (const control of layout.controls ?? []) {
      validateLayoutControl(errors, control);
    }
  }

  for (const tokenGroup of source.tokens ?? []) {
    if (tokenGroup.id) collectId(errors, ids, tokenGroup, { packageMode });
    for (const control of tokenGroup.controls ?? []) {
      validateTokenControl(errors, control);
    }
  }

  for (const invariant of source.acceptance?.invariants ?? []) {
    if (invariant.target && !targetExists(invariant.target, index, { allowWildcard: true })) {
      unresolvedFlowTarget(errors, invariant, invariant.target);
    }
  }
}

function validateFlowStep(errors, step, index) {
  if (step.from && !index.any.has(step.from)) {
    unresolvedFlowTarget(errors, step, step.from);
  }

  if (step.to && !index.any.has(step.to)) {
    unresolvedFlowTarget(errors, step, step.to);
  }

  const action = parseActionValue(step.action);
  if (!action.type || !PACKAGE_FLOW_ACTION_TYPES.has(action.type)) {
    unresolvedFlowTarget(errors, step, step.action);
    return;
  }

  if (action.target && !index.any.has(action.target)) {
    unresolvedFlowTarget(errors, step, action.target);
  }
}

function validateLayoutTarget(errors, layout, index) {
  if (!targetExists(layout.target, index)) {
    errors.push({
      code: "unresolved_layout_target",
      message: `Layout target "${layout.target}" does not match a declared screen, region, or block.`,
      line: layout.line,
      sourceFile: layout.sourceFile
    });
  }
}

function validateLayoutControl(errors, control) {
  const name = control.name;
  const value = control.attrs?.value;

  if (!Object.hasOwn(LAYOUT_CONTROL_VALUES, name)) {
    unsupportedLayoutControl(errors, control, name, value);
    return;
  }

  if (!value || !LAYOUT_CONTROL_VALUES[name].has(value)) {
    unsupportedLayoutControl(errors, control, name, value);
  }

  if (name === "collapse" && control.attrs?.at && !LAYOUT_CONTROL_VALUES.collapseAt.has(control.attrs.at)) {
    unsupportedLayoutControl(errors, control, "collapseAt", control.attrs.at);
  }
}

function validateTokenControl(errors, control) {
  const value = control.attrs?.value;

  if (!Object.hasOwn(TOKEN_CONTROL_VALUES, control.name)) {
    unsupportedTokenControl(errors, control, control.name, value);
    return;
  }

  if (hasRawTokenValue(value) || hasRawTokenValue(control.target)) {
    unsupportedTokenControl(errors, control, control.name, value);
    return;
  }

  if (control.name === "tone") {
    const target = control.target;
    if (!TOKEN_CONTROL_VALUES.tone.has(target) || !TOKEN_CONTROL_VALUES.toneValue.has(value)) {
      unsupportedTokenControl(errors, control, control.name, value);
    }
    return;
  }

  if (!value || !TOKEN_CONTROL_VALUES[control.name].has(value)) {
    unsupportedTokenControl(errors, control, control.name, value);
  }
}

function collectReferenceIndex(source) {
  const index = {
    screens: new Set(),
    regions: new Set(),
    blocks: new Set(),
    states: new Set(),
    actions: new Set(),
    flows: new Set(),
    content: new Set(),
    any: new Set()
  };

  const add = (set, id) => {
    if (!id) return;
    set.add(id);
    index.any.add(id);
  };

  for (const screen of source.screens ?? []) {
    add(index.screens, screen.id);
    for (const region of screen.regions ?? []) {
      add(index.regions, region.id);
      for (const block of region.blocks ?? []) collectBlockReferenceIds(index, block);
    }
    for (const section of screen.sections ?? []) {
      add(index.regions, section.id);
      for (const action of section.actions ?? []) add(index.actions, action.id);
      for (const element of section.elements ?? []) add(index.actions, element.action ? element.id : "");
      for (const block of section.blocks ?? []) collectBlockReferenceIds(index, block);
    }
    for (const state of screen.states ?? []) add(index.states, state.id);
  }

  for (const flow of source.flows ?? []) add(index.flows, flow.id);
  for (const record of source.contentRecords ?? []) add(index.content, record.id);

  return index;
}

function collectBlockReferenceIds(index, block) {
  index.blocks.add(block.id);
  index.any.add(block.id);

  for (const action of block.actions ?? []) {
    index.actions.add(action.id);
    index.any.add(action.id);
  }

  for (const item of block.items ?? []) {
    if (item.action) {
      index.actions.add(item.id);
      index.any.add(item.id);
    }
  }

  for (const state of block.states ?? []) {
    index.states.add(state.id);
    index.any.add(state.id);
    for (const action of state.actions ?? []) {
      index.actions.add(action.id);
      index.any.add(action.id);
    }
  }
}

function getAllBlocks(source) {
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

function targetExists(target, index, options = {}) {
  const match = String(target ?? "").match(/^([a-z]+):(.+)$/);
  if (!match) return index.any.has(String(target ?? ""));

  const [, kind, id] = match;
  if (options.allowWildcard && id === "*") return Object.hasOwn(index, `${kind}s`);

  if (kind === "screen") return index.screens.has(id);
  if (kind === "region") return index.regions.has(id);
  if (kind === "block") return index.blocks.has(id);
  if (kind === "state") return index.states.has(id);
  if (kind === "action") return index.actions.has(id);
  if (kind === "flow") return index.flows.has(id);
  if (kind === "content") return index.content.has(id);
  return false;
}

function parseActionValue(value) {
  const [type, ...targetParts] = String(value ?? "").split(":");
  return {
    type,
    target: targetParts.join(":")
  };
}

function requirePackageId(errors, node, kind) {
  if (node.id) return;

  errors.push({
    code: `missing_${kind.replaceAll(" ", "_")}_id`,
    message: `${capitalize(kind)} must include a stable id.`,
    line: node.line,
    sourceFile: node.sourceFile
  });
}

function unresolvedFlowTarget(errors, node, target) {
  errors.push({
    code: "unresolved_flow_target",
    message: `Flow target "${target}" does not match a declared package id.`,
    line: node.line,
    sourceFile: node.sourceFile
  });
}

function unsupportedLayoutControl(errors, control, name, value) {
  errors.push({
    code: "unsupported_layout_control",
    message: `Unsupported layout control "${name}" with value "${value ?? ""}".`,
    line: control.line,
    sourceFile: control.sourceFile
  });
}

function unsupportedTokenControl(errors, control, name, value) {
  errors.push({
    code: "unsupported_token_control",
    message: `Unsupported token control "${name}" with value "${value ?? ""}".`,
    line: control.line,
    sourceFile: control.sourceFile
  });
}

function hasRawTokenValue(value) {
  return /#|rgb\(|hsl\(|var\(|--|\.|(?:^|\s)(?:btn|card|navbar|container|row|col)-/.test(String(value ?? ""));
}

function validateSpecAttrs(errors, source) {
  validateImplementationAttrs(errors, source?.attrs, source?.line);

  if (source?.surface && !SURFACES.has(source.surface)) {
    errors.push({
      code: "unsupported_surface",
      message: `Unsupported surface "${source.surface}".`,
      line: source.line
    });
  }

  if (source?.adapter && !ADAPTER_TARGETS.has(source.adapter)) {
    errors.push({
      code: "unsupported_adapter",
      message: `Unsupported adapter "${source.adapter}".`,
      line: source.line
    });
  }
}

function validateScreen(errors, source, screen) {
  validateImplementationAttrs(errors, screen.attrs, screen.line);
  validateGap(errors, screen, "screen", { required: (screen.regions ?? []).length > 0 });

  if (screen.shell && !SHELLS.has(screen.shell)) {
    errors.push({
      code: "unsupported_shell",
      message: `Unsupported shell "${screen.shell}".`,
      line: screen.line
    });
  }

  if (screen.kind && !SCREEN_KINDS.has(screen.kind)) {
    errors.push({
      code: "unsupported_screen_kind",
      message: `Unsupported screen kind "${screen.kind}".`,
      line: screen.line
    });
    return;
  }

  const family = getScreenFamily(source, screen);
  if (screen.kind && family === "app" && !APP_SCREEN_KINDS.has(screen.kind)) {
    errors.push({
      code: "invalid_screen_kind",
      message: `Screen kind "${screen.kind}" is not valid for app screens.`,
      line: screen.line
    });
  }

  if (
    screen.kind &&
    family === "marketing" &&
    !MARKETING_SCREEN_KINDS.has(screen.kind)
  ) {
    errors.push({
      code: "invalid_screen_kind",
      message: `Screen kind "${screen.kind}" is not valid for marketing screens.`,
      line: screen.line
    });
  }
}

function validateRegion(errors, source, screen, region) {
  validateImplementationAttrs(errors, region.attrs, region.line);
  validateGap(errors, region, "region", { required: true });

  if (!REGION_TYPES.has(region.type)) {
    errors.push({
      code: "unsupported_region_type",
      message: `Unsupported region type "${region.type}".`,
      line: region.line
    });
    return;
  }

  const family = getScreenFamily(source, screen);
  if (family === "app" && !APP_REGION_TYPES.has(region.type)) {
    errors.push({
      code: "invalid_semantic_nesting",
      message: `Region type "${region.type}" is not valid inside an app screen.`,
      line: region.line
    });
  }

  if (family === "marketing" && !MARKETING_REGION_TYPES.has(region.type)) {
    errors.push({
      code: "invalid_semantic_nesting",
      message: `Region type "${region.type}" is not valid inside a marketing screen.`,
      line: region.line
    });
  }
}

function validateBlockAndChildren(
  errors,
  ids,
  source,
  screen,
  block,
  screenIds,
  stateIds,
  options = {}
) {
  requireId(errors, block, "block");
  validateBlock(errors, source, screen, block);
  collectId(errors, ids, block, options);

  for (const item of block.items ?? []) {
    requireId(errors, item, "item");
    validateItem(errors, item, screenIds, stateIds);
    collectId(errors, ids, item, options);
  }

  for (const action of block.actions ?? []) {
    requireId(errors, action, "action");
    validateAction(errors, action, screenIds, stateIds);
    collectId(errors, ids, action, options);
  }

  for (const state of block.states ?? []) {
    requireId(errors, state, "state");
    collectId(errors, ids, state, options);
    validateState(errors, state);

    for (const item of state.items ?? []) {
      requireId(errors, item, "item");
      validateItem(errors, item, screenIds, stateIds);
      collectId(errors, ids, item, options);
    }

    for (const action of state.actions ?? []) {
      requireId(errors, action, "action");
      validateAction(errors, action, screenIds, stateIds);
      collectId(errors, ids, action, options);
    }
  }
}

function validateBlock(errors, source, screen, block) {
  validateImplementationAttrs(errors, block.attrs, block.line);
  validateGap(errors, block, "block", { required: true });

  if (!BLOCK_TYPES.has(block.type)) {
    errors.push({
      code: "unsupported_block_type",
      message: `Unsupported block type "${block.type}".`,
      line: block.line
    });
    return;
  }

  if (block.variant && !BLOCK_VARIANTS.has(block.variant)) {
    errors.push({
      code: "unsupported_block_variant",
      message: `Unsupported block variant "${block.variant}".`,
      line: block.line
    });
  }

  const family = getScreenFamily(source, screen);
  if (family === "app" && !APP_BLOCK_TYPES.has(block.type)) {
    errors.push({
      code: "invalid_semantic_nesting",
      message: `Block type "${block.type}" is not valid inside an app screen.`,
      line: block.line
    });
  }

  if (family === "marketing" && !MARKETING_BLOCK_TYPES.has(block.type)) {
    errors.push({
      code: "invalid_semantic_nesting",
      message: `Block type "${block.type}" is not valid inside a marketing screen.`,
      line: block.line
    });
  }
}

function validateState(errors, state) {
  validateImplementationAttrs(errors, state.attrs, state.line);
  if (!STATE_TYPES.has(state.type)) {
    errors.push({
      code: "unsupported_state_type",
      message: `Unsupported state type "${state.type}".`,
      line: state.line
    });
  }
}

function requireId(errors, node, kind) {
  if (node.id) return;

  errors.push({
    code: `missing_${kind}_id`,
    message: `${capitalize(kind)} must include a stable id.`,
    line: node.line
  });
}

function validateElement(errors, element, screenIds, stateIds) {
  validateImplementationAttrs(errors, element.props, element.line);

  if (!ELEMENT_TYPES.has(element.type)) {
    errors.push({
      code: "unsupported_element_type",
      message: `Unsupported element type "${element.type}".`,
      line: element.line
    });
  }

  if (element.action) {
    validateAction(errors, {
      id: element.id,
      label: element.label,
      type: element.action.type,
      target: element.action.target,
      line: element.line
    }, screenIds, stateIds);
  }
}

function validateItem(errors, item, screenIds, stateIds) {
  validateImplementationAttrs(errors, item.props, item.line);
  validateImplementationAttrs(errors, item.attrs, item.line);

  if (!ITEM_TYPES.has(item.type)) {
    errors.push({
      code: "unsupported_item_type",
      message: `Unsupported item type "${item.type}".`,
      line: item.line
    });
  }

  if (item.action) {
    validateAction(errors, {
      id: item.id,
      label: item.label,
      type: item.action.type,
      target: item.action.target,
      line: item.line
    }, screenIds, stateIds);
  }
}

function validateAction(errors, action, screenIds, stateIds) {
  if (!ACTION_TYPES.has(action.type)) {
    errors.push({
      code: "invalid_action_type",
      message: `Invalid action type "${action.type}".`,
      line: action.line
    });
    return;
  }

  if (!action.target) {
    errors.push({
      code: "missing_action_target",
      message: `Action "${action.id}" must include a target.`,
      line: action.line
    });
    return;
  }

  if (SCREEN_ACTIONS.has(action.type) && !screenIds.has(action.target)) {
    errors.push({
      code: "invalid_navigation_target",
      message: `Navigation target "${action.target}" does not match a screen id.`,
      line: action.line
    });
  }

  if (STATE_ACTIONS.has(action.type) && !stateIds.has(action.target)) {
    errors.push({
      code: "invalid_state_target",
      message: `State target "${action.target}" does not match a state id.`,
      line: action.line
    });
  }
}

function validateImplementationAttrs(errors, attrs, line) {
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (
      IMPLEMENTATION_DETAIL_PATTERN.test(`${key}=${value}`) ||
      ["class", "className", "component", "style"].includes(key)
    ) {
      errors.push({
        code: "implementation_detail",
        message: `Implementation-specific attribute "${key}" is not supported.`,
        line
      });
    }
  }
}

function validateGap(errors, node, kind, options = {}) {
  const gap = node.gap ?? node.attrs?.gap;

  if (!gap && options.required) {
    errors.push({
      code: `missing_${kind}_gap`,
      message: `${capitalize(kind)} must specify a supported gap value.`,
      line: node.line
    });
    return;
  }

  if (gap && !GAP_VALUES.has(gap)) {
    errors.push({
      code: "unsupported_gap",
      message: `Unsupported gap "${gap}".`,
      line: node.line
    });
  }
}

function collectId(errors, ids, node, options = {}) {
  if (!node.id) return;

  if (ids.has(node.id)) {
    const code = options.packageMode ? "duplicate_package_id" : "duplicate_id";
    errors.push({
      code,
      message: `Duplicate id "${node.id}".`,
      line: node.line
    });
    return;
  }

  ids.set(node.id, node.line);
}

function getScreenFamily(source, screen) {
  if (screen.shell === "app" || screen.shell === "marketing") return screen.shell;
  if (source?.surface === "app" || source?.surface === "marketing") {
    return source.surface;
  }
  return undefined;
}

function getBlockStates(screen) {
  const states = [];

  for (const region of screen.regions ?? []) {
    for (const block of region.blocks ?? []) {
      states.push(...(block.states ?? []));
    }
  }

  for (const section of screen.sections ?? []) {
    for (const block of section.blocks ?? []) {
      states.push(...(block.states ?? []));
    }
  }

  return states;
}

function hasError(errors, code) {
  return errors.some((error) => error.code === code);
}

function hasAnyError(errors, codes) {
  return errors.some((error) => codes.includes(error.code));
}

function capitalize(value) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
