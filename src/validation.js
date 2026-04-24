import { ACTION_TYPES, ELEMENT_TYPES, STATE_TYPES } from "./contracts.js";

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
  }

  for (const screen of source?.screens ?? []) {
    requireId(errors, screen, "screen");
    collectId(errors, ids, screen);

    for (const section of screen.sections ?? []) {
      requireId(errors, section, "section");
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

function requireId(errors, node, kind) {
  if (node.id) return;

  errors.push({
    code: `missing_${kind}_id`,
    message: `${capitalize(kind)} must include a stable id.`,
    line: node.line
  });
}

function validateElement(errors, element, screenIds, stateIds) {
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

function hasError(errors, code) {
  return errors.some((error) => error.code === code);
}

function capitalize(value) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
