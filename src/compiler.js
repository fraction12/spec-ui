import { createHash } from "node:crypto";

import { parseSpec } from "./parser.js";
import { validateSource } from "./validation.js";
import { SPEC_UI_VERSION } from "./contracts.js";

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

  return {
    version: SPEC_UI_VERSION,
    title: source.title,
    metadata: {
      generatedBy: "spec-ui",
      sourceHash: createHash("sha256").update(markdown).digest("hex"),
      compiledAt: options.compiledAt ?? null
    },
    screens: source.screens.map(compileScreen)
  };
}

export function serializeIr(ir) {
  return `${JSON.stringify(ir, null, 2)}\n`;
}

function compileScreen(screen) {
  return {
    id: screen.id,
    title: screen.title,
    sections: screen.sections.map(compileSection),
    states: screen.states.map(compileState)
  };
}

function compileSection(section) {
  const elements = section.elements.map(compileElement);
  const elementActions = section.elements
    .filter((element) => element.action)
    .map((element) => ({
      id: element.id,
      label: element.label,
      type: element.action.type,
      target: element.action.target
    }));

  return {
    id: section.id,
    title: section.title,
    elements,
    actions: [...elementActions, ...section.actions.map(compileAction)]
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
  const compiled = {
    id: element.id,
    type: element.type,
    label: element.label,
    props: { ...element.props }
  };

  if (element.action) {
    compiled.action = options.inlineAction
      ? {
          id: element.id,
          label: element.label,
          type: element.action.type,
          target: element.action.target
        }
      : element.id;
  }

  return compiled;
}

function compileAction(action) {
  return {
    id: action.id,
    label: action.label,
    type: action.type,
    target: action.target
  };
}
