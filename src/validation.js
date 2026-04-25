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
  MARKETING_BLOCK_TYPES,
  MARKETING_REGION_TYPES,
  MARKETING_SCREEN_KINDS,
  REGION_TYPES,
  SCREEN_KINDS,
  SHELLS,
  STATE_TYPES,
  SURFACES
} from "./contracts.js";

const SCREEN_ACTIONS = new Set(["navigate"]);
const STATE_ACTIONS = new Set(["open-modal", "close-modal", "show-state", "set-tab", "toggle"]);

export function validateSource(source) {
  const errors = [];
  const parseErrors = source?.errors ?? [];

  errors.push(...parseErrors.filter((error) => error.code !== "raw_html"));

  if (!source?.title && !hasError(errors, "missing_spec_title")) {
    errors.push({
      code: "missing_spec_title",
      message: 'First non-empty line must be "# Spec: <title>".',
      line: source?.line ?? 1
    });
  }

  validateSpecAttrs(errors, source);

  if (!source?.screens?.length) {
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
    collectId(errors, ids, screen);

    for (const region of screen.regions ?? []) {
      requireId(errors, region, "region");
      validateRegion(errors, source, screen, region);
      collectId(errors, ids, region);

      for (const block of region.blocks ?? []) {
        validateBlockAndChildren(errors, ids, source, screen, block, screenIds, stateIds);
      }
    }

    for (const section of screen.sections ?? []) {
      requireId(errors, section, "section");
      validateImplementationAttrs(errors, section.attrs, section.line);
      collectId(errors, ids, section);

      for (const element of section.elements ?? []) {
        requireId(errors, element, "element");
        validateElement(errors, element, screenIds, stateIds);
        collectId(errors, ids, element);
      }

      for (const action of section.actions ?? []) {
        requireId(errors, action, "action");
        validateAction(errors, action, screenIds, stateIds);
        collectId(errors, ids, action);
      }

      for (const block of section.blocks ?? []) {
        validateBlockAndChildren(errors, ids, source, screen, block, screenIds, stateIds);
      }
    }

    for (const state of screen.states ?? []) {
      requireId(errors, state, "state");
      collectId(errors, ids, state);
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
        collectId(errors, ids, item);
      }
    }
  }

  errors.push(...parseErrors.filter((error) => error.code === "raw_html"));
  return errors;
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
  stateIds
) {
  requireId(errors, block, "block");
  validateBlock(errors, source, screen, block);
  collectId(errors, ids, block);

  for (const item of block.items ?? []) {
    requireId(errors, item, "item");
    validateItem(errors, item, screenIds, stateIds);
    collectId(errors, ids, item);
  }

  for (const action of block.actions ?? []) {
    requireId(errors, action, "action");
    validateAction(errors, action, screenIds, stateIds);
    collectId(errors, ids, action);
  }

  for (const state of block.states ?? []) {
    requireId(errors, state, "state");
    collectId(errors, ids, state);
    validateState(errors, state);

    for (const item of state.items ?? []) {
      requireId(errors, item, "item");
      validateItem(errors, item, screenIds, stateIds);
      collectId(errors, ids, item);
    }

    for (const action of state.actions ?? []) {
      requireId(errors, action, "action");
      validateAction(errors, action, screenIds, stateIds);
      collectId(errors, ids, action);
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

function collectId(errors, ids, node) {
  if (!node.id) return;

  if (ids.has(node.id)) {
    errors.push({
      code: "duplicate_id",
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

function capitalize(value) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
