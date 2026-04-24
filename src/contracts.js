/**
 * Shared source model and IR contracts.
 *
 * The implementation uses plain ESM and JSDoc typedefs so the first version
 * stays dependency-free while still keeping the compiler boundary explicit.
 */

export const SPEC_UI_VERSION = "0.1.0";

export const ELEMENT_TYPES = new Set([
  "text",
  "button",
  "input",
  "field",
  "list",
  "card",
  "badge",
  "empty",
  "loading",
  "success",
  "error"
]);

export const ACTION_TYPES = new Set([
  "navigate",
  "open-modal",
  "close-modal",
  "toggle",
  "show-state",
  "set-tab"
]);

export const STATE_TYPES = new Set([
  "default",
  "loading",
  "empty",
  "success",
  "error",
  "modal",
  "tab",
  "revealed"
]);

export const RESERVED_HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;

/**
 * @typedef {Object} SourceSpec
 * @property {string} title
 * @property {SourceScreen[]} screens
 */

/**
 * @typedef {Object} SourceScreen
 * @property {string} id
 * @property {string} title
 * @property {SourceSection[]} sections
 * @property {SourceState[]} states
 */

/**
 * @typedef {Object} SourceSection
 * @property {string} id
 * @property {string} title
 * @property {SourceElement[]} elements
 * @property {SourceAction[]} actions
 */

/**
 * @typedef {Object} SourceElement
 * @property {string} id
 * @property {string} type
 * @property {string} label
 * @property {Record<string, string>} props
 */

/**
 * @typedef {Object} SourceAction
 * @property {string} id
 * @property {string} label
 * @property {string} type
 * @property {string} target
 */

/**
 * @typedef {Object} SourceState
 * @property {string} id
 * @property {string} type
 * @property {string} label
 * @property {string[]} items
 */
