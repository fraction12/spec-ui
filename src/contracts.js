/**
 * Shared source model and IR contracts.
 *
 * The implementation uses plain ESM and JSDoc typedefs so the first version
 * stays dependency-free while still keeping the compiler boundary explicit.
 */

export const SPEC_UI_VERSION = "0.1.0";

export const SURFACES = new Set(["app", "marketing"]);

export const SHELLS = new Set(["app", "marketing", "none"]);

export const ADAPTER_TARGETS = new Set(["baseline", "bootstrap-html"]);

export const PACKAGE_MANIFEST = "prototype.md";

export const PACKAGE_ROLES = new Set([
  "screens",
  "flows",
  "content",
  "layout",
  "tokens",
  "acceptance"
]);

export const GAP_VALUES = new Set(["none", "xs", "sm", "md", "lg", "xl"]);

export const LAYOUT_CONTROL_VALUES = {
  gap: GAP_VALUES,
  padding: new Set(["none", "xs", "sm", "md", "lg", "xl"]),
  density: new Set(["compact", "cozy", "comfortable", "spacious"]),
  width: new Set(["narrow", "content", "wide", "full"]),
  align: new Set(["start", "center", "end", "stretch", "between"]),
  columns: new Set(["1", "2", "3", "4", "auto"]),
  collapse: new Set(["none", "stack", "tabs", "scroll", "wrap"]),
  collapseAt: new Set(["mobile", "tablet", "desktop"]),
  text: new Set(["wrap", "nowrap", "truncate", "balance"]),
  overflow: new Set(["visible", "contain", "scroll", "clip"])
};

export const LAYOUT_CONTROLS = new Set(Object.keys(LAYOUT_CONTROL_VALUES));

export const TOKEN_CONTROL_VALUES = {
  tone: new Set(["brand", "neutral", "success", "warning", "danger", "info"]),
  toneValue: new Set(["blue", "teal", "green", "amber", "red", "purple", "slate", "gray"]),
  radius: new Set(["none", "sm", "md", "lg", "pill"]),
  density: new Set(["compact", "cozy", "comfortable"]),
  treatment: new Set(["plain", "outlined", "filled", "elevated", "ghost"]),
  brand: new Set(["blue", "teal", "green", "amber", "red", "purple", "slate", "gray"]),
  controls: new Set(["none", "sm", "md", "lg", "pill"]),
  interface: new Set(["compact", "cozy", "comfortable"]),
  cards: new Set(["plain", "outlined", "filled", "elevated", "ghost"])
};

export const TOKEN_CONTROLS = new Set(Object.keys(TOKEN_CONTROL_VALUES));

export const ACCEPTANCE_INVARIANTS = new Set([
  "Stable navigation labels",
  "Single modal stack",
  "Reachable flow",
  "Overflow containment"
]);

export const PACKAGE_FLOW_ACTION_TYPES = new Set([
  "navigate",
  "open-modal",
  "close-modal",
  "open-drawer",
  "close-drawer",
  "submit-form",
  "set-tab",
  "toggle",
  "show-state"
]);

export const APP_SCREEN_KINDS = new Set([
  "dashboard",
  "list",
  "detail",
  "form",
  "settings",
  "onboarding",
  "workflow"
]);

export const MARKETING_SCREEN_KINDS = new Set([
  "landing",
  "feature",
  "pricing",
  "contact",
  "signup"
]);

export const SCREEN_KINDS = new Set([
  ...APP_SCREEN_KINDS,
  ...MARKETING_SCREEN_KINDS
]);

export const APP_REGION_TYPES = new Set([
  "sidebar",
  "topbar",
  "content",
  "aside",
  "footer"
]);

export const MARKETING_REGION_TYPES = new Set(["navbar", "main", "footer"]);

export const REGION_TYPES = new Set([
  ...APP_REGION_TYPES,
  ...MARKETING_REGION_TYPES
]);

export const APP_BLOCK_TYPES = new Set([
  "nav",
  "page-header",
  "metric-row",
  "data-table",
  "collection-list",
  "detail-panel",
  "form",
  "settings-group",
  "onboarding-steps",
  "activity-feed",
  "tabs",
  "filters",
  "state-panel",
  "modal",
  "drawer",
  "confirmation"
]);

export const MARKETING_BLOCK_TYPES = new Set([
  "navbar",
  "hero",
  "logo-cloud",
  "feature-grid",
  "feature-band",
  "pricing",
  "testimonial-group",
  "faq",
  "cta",
  "footer",
  "contact-form",
  "signup-form"
]);

export const BLOCK_TYPES = new Set([
  ...APP_BLOCK_TYPES,
  ...MARKETING_BLOCK_TYPES
]);

export const BLOCK_VARIANTS = new Set([
  "default",
  "compact",
  "primary",
  "with-actions",
  "featured",
  "split",
  "stacked",
  "inline",
  "cards",
  "list",
  "table",
  "selectable",
  "danger",
  "summary",
  "alternating",
  "three-column",
  "two-tier",
  "three-tier",
  "dense",
  "band"
]);

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

export const ITEM_TYPES = new Set([
  "nav-item",
  "action",
  "button",
  "text",
  "metric",
  "column",
  "row",
  "field",
  "select",
  "toggle",
  "badge",
  "step",
  "activity",
  "tab",
  "empty",
  "loading",
  "success",
  "error",
  "headline",
  "subhead",
  "logo",
  "feature",
  "pricing-tier",
  "price",
  "testimonial",
  "quote",
  "faq-item"
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
  "revealed",
  "drawer",
  "confirmation"
]);

export const RESERVED_HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;

export const IMPLEMENTATION_DETAIL_PATTERN =
  /\b(?:class|className|component|style)\s*=|<\/?(?:script|style)\b|<[A-Z][A-Za-z0-9.:-]*(?:\s|>|\/>)/;

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
