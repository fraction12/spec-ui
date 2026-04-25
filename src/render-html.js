import {
  ACTION_TYPES,
  BLOCK_TYPES,
  ELEMENT_TYPES,
  ITEM_TYPES,
  SPEC_UI_VERSION,
  STATE_TYPES
} from "./contracts.js";
import {
  BOOTSTRAP_COMPAT_CSS,
  BOOTSTRAP_HTML_ADAPTER_VERSION,
  BOOTSTRAP_LIBRARY
} from "./bootstrap-html-assets.js";

export class RenderHtmlError extends Error {
  constructor(errors) {
    super("Spec UI HTML rendering failed.");
    this.name = "RenderHtmlError";
    this.errors = errors;
  }
}

export const HTML_ADAPTER_REGISTRY = Object.freeze({
  baseline: Object.freeze({
    target: "baseline",
    version: SPEC_UI_VERSION,
    resolvedTarget: "baseline",
    assetProvenance: "inline"
  }),
  "bootstrap-html": Object.freeze({
    target: "bootstrap-html",
    version: BOOTSTRAP_HTML_ADAPTER_VERSION,
    resolvedTarget: "bootstrap-html",
    resolvedLibrary: BOOTSTRAP_LIBRARY,
    assetProvenance: BOOTSTRAP_LIBRARY.provenance
  })
});

const STATE_TYPES_HIDDEN_BY_DEFAULT = new Set([
  "empty",
  "error",
  "loading",
  "modal",
  "drawer",
  "confirmation",
  "revealed",
  "success"
]);

export function renderHtml(ir, options = {}) {
  const adapter = resolveHtmlAdapter(ir, options);

  if (adapter.target === "baseline") {
    return renderBaselineHtml(ir);
  }

  return renderBootstrapHtml(ir, adapter);
}

function renderBaselineHtml(ir) {
  const title = ir?.metadata?.title || ir?.title || "Spec UI Prototype";
  const screens = Array.isArray(ir?.screens) ? ir.screens : [];

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${escapeHtml(title)}</title>`,
    "  <style>",
    stylesheet(),
    "  </style>",
    "</head>",
    `<body data-spec-ui-version="${escapeAttribute(SPEC_UI_VERSION)}">`,
    '  <main class="spec-ui-shell" data-spec-ui-root>',
    `    <h1>${escapeHtml(title)}</h1>`,
    screens.map((screen, index) => renderScreen(screen, index === 0)).join(""),
    "  </main>",
    "  <script>",
    script(),
    "  </script>",
    "</body>",
    "</html>",
    ""
  ].join("\n");
}

function resolveHtmlAdapter(ir, options) {
  const requested =
    options.adapter ||
    options.renderingTarget?.target ||
    options.renderingTarget ||
    ir?.metadata?.renderingTarget?.resolvedTarget ||
    ir?.metadata?.renderingTarget?.target ||
    ir?.metadata?.adapter?.target ||
    ir?.metadata?.adapter ||
    "baseline";
  const target = String(requested);
  const adapter = HTML_ADAPTER_REGISTRY[target];

  if (!adapter) {
    throw new RenderHtmlError([
      {
        code: "unsupported_adapter",
        message: `Unsupported HTML adapter "${target}". Supported adapters: ${Object.keys(HTML_ADAPTER_REGISTRY).join(", ")}.`
      }
    ]);
  }

  return adapter;
}

const BOOTSTRAP_SUPPORTED_BLOCK_TYPES = new Set(BLOCK_TYPES);
const BOOTSTRAP_SUPPORTED_ITEM_TYPES = new Set([...ITEM_TYPES, ...ELEMENT_TYPES]);
const RAW_DETAIL_KEYS = new Set([
  "class",
  "className",
  "component",
  "css",
  "html",
  "jsx",
  "script",
  "style",
  "javascript"
]);
const RAW_DETAIL_PATTERN =
  /\b(?:btn|container(?:-fluid)?|row(?:-cols)?|col-(?:\d|lg|md|sm)|navbar|card|modal|dropdown|d-flex|p[xtblrse]?-\d|m[xtblrse]?-\d|text-(?:primary|secondary|success|danger|warning|info|light|dark)|bg-(?:primary|secondary|success|danger|warning|info|light|dark))\b|<\/?[a-z][\s\S]*>|<[A-Z][A-Za-z0-9.:-]*(?:\s|>|\/>)|(?:^|[;\s])(?:display|color|margin|padding|font|background|border)\s*:/i;

const LAYOUT_CONTROL_VALUES = Object.freeze({
  gap: new Set(["none", "xs", "sm", "md", "lg", "xl"]),
  padding: new Set(["none", "xs", "sm", "md", "lg", "xl"]),
  density: new Set(["compact", "cozy", "comfortable", "spacious"]),
  width: new Set(["narrow", "content", "wide", "full"]),
  align: new Set(["start", "center", "end", "stretch", "between"]),
  columns: new Set(["1", "2", "3", "4", "auto"]),
  collapse: new Set(["none", "stack", "tabs", "scroll", "drawer", "wrap"]),
  collapseAt: new Set(["mobile", "tablet", "desktop"]),
  text: new Set(["wrap", "nowrap", "truncate", "balance"]),
  overflow: new Set(["contain", "scroll", "visible", "clip"])
});

const TOKEN_CONTROL_VALUES = Object.freeze({
  tone: new Set(["blue", "teal", "green", "amber", "red", "neutral", "slate", "violet", "indigo", "gray"]),
  brand: new Set(["blue", "teal", "green", "amber", "red", "neutral", "slate", "violet", "indigo", "gray"]),
  accent: new Set(["blue", "teal", "green", "amber", "red", "neutral", "slate", "violet", "indigo", "gray"]),
  success: new Set(["blue", "teal", "green", "amber", "red", "neutral", "slate", "violet", "indigo", "gray"]),
  critical: new Set(["blue", "teal", "green", "amber", "red", "neutral", "slate", "violet", "indigo", "gray"]),
  warning: new Set(["blue", "teal", "green", "amber", "red", "neutral", "slate", "violet", "indigo", "gray"]),
  danger: new Set(["blue", "teal", "green", "amber", "red", "neutral", "slate", "violet", "indigo", "gray"]),
  info: new Set(["blue", "teal", "green", "amber", "red", "neutral", "slate", "violet", "indigo", "gray"]),
  radius: new Set(["none", "sm", "md", "lg", "pill"]),
  density: new Set(["compact", "cozy", "comfortable", "spacious"]),
  treatment: new Set(["plain", "flat", "outlined", "elevated", "filled", "ghost"]),
  cards: new Set(["plain", "flat", "outlined", "elevated", "filled", "ghost"])
});

function renderBootstrapHtml(ir, adapter) {
  const errors = validateBootstrapIr(ir);

  if (errors.length > 0) {
    throw new RenderHtmlError(errors);
  }

  const title = ir?.metadata?.title || ir?.title || "Spec UI Prototype";
  const screens = Array.isArray(ir?.screens) ? ir.screens : [];
  const tokenClasses = bootstrapTokenClasses(readBootstrapTokens(ir));

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <meta name="spec-ui-adapter" content="${escapeAttribute(adapter.target)}">`,
    `  <meta name="spec-ui-bootstrap" content="${escapeAttribute(adapter.resolvedLibrary.version)}">`,
    `  <title>${escapeHtml(title)}</title>`,
    "  <style>",
    BOOTSTRAP_COMPAT_CSS,
    "  </style>",
    "</head>",
    `<body class="${tokenClasses.join(" ")}" data-spec-ui-version="${escapeAttribute(SPEC_UI_VERSION)}" data-spec-ui-adapter="${escapeAttribute(adapter.target)}" data-bootstrap-provenance="${escapeAttribute(adapter.assetProvenance)}">`,
    '  <main class="spec-bs-shell container-fluid" data-spec-ui-root>',
    `    <h1 class="spec-bs-title">${escapeHtml(title)}</h1>`,
    screens.map((screen, index) => renderBootstrapScreen(screen, index === 0)).join(""),
    "  </main>",
    "  <script>",
    bootstrapScript(),
    "  </script>",
    "</body>",
    "</html>",
    ""
  ].join("\n");
}

function validateBootstrapIr(ir) {
  const errors = [];

  for (const [name, value] of Object.entries(readBootstrapTokens(ir))) {
    const values = TOKEN_CONTROL_VALUES[name];
    if (!values || !values.has(String(value))) {
      errors.push({
        code: "unsupported_token_control",
        message: `Unsupported token control "${name}" with value "${value}".`
      });
    }
  }

  forEachBootstrapNode(ir, (node, kind) => {
    validateRawImplementationDetails(errors, node, kind);
    validateLayoutControls(errors, node, kind);

    if (kind === "block" && !BOOTSTRAP_SUPPORTED_BLOCK_TYPES.has(node.type)) {
      errors.push({
        code: "unsupported_semantic_block",
        message: `Unsupported semantic block "${node.type}".`,
        id: node.id
      });
    }

    if ((kind === "item" || kind === "element") && !BOOTSTRAP_SUPPORTED_ITEM_TYPES.has(node.type)) {
      errors.push({
        code: "unsupported_semantic_item",
        message: `Unsupported semantic item "${node.type}".`,
        id: node.id
      });
    }

    if (kind === "state" && !STATE_TYPES.has(node.type)) {
      errors.push({
        code: "unsupported_semantic_state",
        message: `Unsupported semantic state "${node.type}".`,
        id: node.id
      });
    }

    if (kind === "action" && !ACTION_TYPES.has(node.type)) {
      errors.push({
        code: "unsupported_interaction",
        message: `Unsupported interaction "${node.type}".`,
        id: node.id
      });
    }
  });

  return errors;
}

function forEachBootstrapNode(ir, visit) {
  for (const screen of ir?.screens ?? []) {
    visit(screen, "screen");

    for (const region of screen.regions ?? []) {
      visit(region, "region");

      for (const block of region.blocks ?? []) {
        visitBootstrapBlock(block, visit);
      }
    }

    for (const section of screen.sections ?? []) {
      visit(section, "section");
      for (const element of section.elements ?? []) visitBootstrapElement(element, visit, "element");
      for (const action of section.actions ?? []) visit(action, "action");
    }

    for (const state of screen.states ?? []) {
      visitBootstrapState(state, visit);
    }
  }
}

function visitBootstrapBlock(block, visit) {
  visit(block, "block");
  for (const item of block.items ?? []) visitBootstrapElement(item, visit, "item");
  for (const action of block.actions ?? []) visit(action, "action");
  for (const state of block.states ?? []) visitBootstrapState(state, visit);
}

function visitBootstrapState(state, visit) {
  visit(state, "state");
  for (const item of state.items ?? []) visitBootstrapElement(item, visit, "item");
  for (const action of state.actions ?? []) visit(action, "action");
}

function visitBootstrapElement(element, visit, kind) {
  visit(element, kind);
  const action = normalizeElementAction(element);
  if (action && typeof action === "object") visit(action, "action");
}

function validateRawImplementationDetails(errors, node, kind) {
  for (const [key, value] of Object.entries(node?.props ?? {})) {
    if (RAW_DETAIL_KEYS.has(key) || RAW_DETAIL_PATTERN.test(`${key}=${value}`)) {
      errors.push({
        code: "raw_implementation_detail",
        message: `Raw implementation detail "${key}" is not supported by the adapter.`,
        id: node.id,
        kind
      });
    }
  }
}

function validateLayoutControls(errors, node, kind) {
  for (const [name, value] of Object.entries(readLayoutControls(node))) {
    const values = LAYOUT_CONTROL_VALUES[name];
    if (!values || !values.has(String(value))) {
      errors.push({
        code: "unsupported_layout_control",
        message: `Unsupported layout control "${name}" with value "${value}".`,
        id: node.id,
        kind
      });
    }
  }
}

function renderBootstrapScreen(screen, isActive) {
  const sections = Array.isArray(screen.sections) ? screen.sections : [];
  const states = Array.isArray(screen.states) ? screen.states : [];
  const regions = Array.isArray(screen.regions) ? screen.regions : [];
  const hidden = isActive ? "" : " hidden";
  const shell = screen.shell || "none";
  const kind = screen.kind || "default";
  const layout = bootstrapLayoutClasses(screen);

  if (regions.length > 0) {
    return [
      `    <section class="spec-bs-screen spec-bs-screen-${escapeAttribute(shell)} ${layout.classes}" id="screen-${escapeAttribute(screen.id)}" data-screen-id="${escapeAttribute(screen.id)}" data-screen-shell="${escapeAttribute(shell)}" data-screen-kind="${escapeAttribute(kind)}" ${layout.attrs}${hidden}>`,
      `      <header class="spec-bs-screen-header"><h2>${escapeHtml(screen.title || screen.id)}</h2></header>`,
      `      <div class="row ${bootstrapGapClass(screen.gap)}">`,
      regions.map((region) => renderBootstrapRegion(region, shell)).join("\n"),
      "      </div>",
      states.map((state, index) => renderBootstrapState(state, index, states)).join("\n"),
      "    </section>"
    ].join("\n");
  }

  return [
    `    <section class="spec-bs-screen ${layout.classes}" id="screen-${escapeAttribute(screen.id)}" data-screen-id="${escapeAttribute(screen.id)}" data-screen-kind="${escapeAttribute(kind)}" ${layout.attrs}${hidden}>`,
    `      <header class="spec-bs-screen-header"><h2>${escapeHtml(screen.title || screen.id)}</h2></header>`,
    sections.map(renderBootstrapSection).join("\n"),
    states.map((state, index) => renderBootstrapState(state, index, states)).join("\n"),
    "    </section>"
  ].join("\n");
}

function renderBootstrapRegion(region, shell) {
  const blocks = Array.isArray(region.blocks) ? region.blocks : [];
  const type = region.type || region.id || "region";
  const layout = bootstrapLayoutClasses(region);

  return [
    `        <section class="spec-bs-region ${bootstrapRegionColumn(type, shell)} ${layout.classes}" id="region-${escapeAttribute(region.id || type)}" data-region-id="${escapeAttribute(region.id || type)}" data-region-type="${escapeAttribute(type)}" ${layout.attrs}>`,
    region.title || region.label
      ? `          <h3 class="spec-bs-region-title">${escapeHtml(region.title || region.label)}</h3>`
      : "",
    `          <div class="spec-bs-stack ${bootstrapGapClass(region.gap)}">`,
    blocks.map((block) => renderBootstrapBlock(block)).join("\n"),
    "          </div>",
    "        </section>"
  ].filter(Boolean).join("\n");
}

function renderBootstrapBlock(block) {
  const type = block?.type || "block";
  const id = block?.id || type;
  const title = block?.title || block?.label || id;
  const actions = Array.isArray(block?.actions) ? block.actions : [];
  const actionsById = new Map(actions.map((action) => [action.id, action]));
  const renderedActionIds = new Set();
  const layout = bootstrapLayoutClasses(block);
  const blockClass = bootstrapBlockClass(type);
  const variant = block?.variant
    ? ` data-block-variant="${escapeAttribute(block.variant)}"`
    : "";
  const body = renderBootstrapBlockBody(block, actionsById, renderedActionIds);
  const unrenderedActions = actions
    .filter((action) => !renderedActionIds.has(action.id))
    .map((action) => renderBootstrapAction(action, "                "))
    .join("\n");

  return [
    `            <section class="card spec-bs-block spec-bs-block-${escapeAttribute(type)} ${blockClass} ${layout.classes}" id="block-${escapeAttribute(id)}" data-block-id="${escapeAttribute(id)}" data-block-type="${escapeAttribute(type)}" ${layout.attrs}${variant}>`,
    `              <div class="card-body spec-bs-stack ${bootstrapGapClass(block.gap)}">`,
    shouldRenderBootstrapBlockTitle(type)
      ? `                <h4 class="card-title">${escapeHtml(title)}</h4>`
      : "",
    body,
    unrenderedActions,
    (block.states ?? []).map((state, index, states) => renderBootstrapState(state, index, states)).join("\n"),
    "              </div>",
    "            </section>"
  ].filter(Boolean).join("\n");
}

function renderBootstrapBlockBody(block, actionsById, renderedActionIds) {
  const type = block?.type || "block";
  const items = Array.isArray(block?.items) ? block.items : [];

  if (type === "nav" || type === "navbar") {
    return renderBootstrapNav(items, actionsById, renderedActionIds, type);
  }

  if (type === "metric-row") {
    return renderBootstrapCards(items, actionsById, renderedActionIds, "metric");
  }

  if (type === "data-table") {
    return renderBootstrapDataTable(items, actionsById, renderedActionIds);
  }

  if (["form", "settings-group", "contact-form", "signup-form", "filters"].includes(type)) {
    return renderBootstrapForm(items, actionsById, renderedActionIds);
  }

  if (type === "hero" || type === "cta" || type === "page-header") {
    return [
      '                <div class="spec-bs-stack">',
      items.map((item) => renderBootstrapElement(item, "                  ", actionsById, renderedActionIds)).join("\n"),
      "                </div>"
    ].join("\n");
  }

  if (type === "tabs") {
    return renderBootstrapNav(items, actionsById, renderedActionIds, "tabs");
  }

  if ([
    "pricing",
    "feature-grid",
    "feature-band",
    "collection-list",
    "onboarding-steps",
    "activity-feed",
    "logo-cloud",
    "testimonial-group",
    "faq",
    "detail-panel",
    "state-panel",
    "footer",
    "modal",
    "drawer",
    "confirmation"
  ].includes(type)) {
    return renderBootstrapCards(items, actionsById, renderedActionIds, type);
  }

  return [
    '                <div class="spec-bs-stack">',
    items.map((item) => renderBootstrapElement(item, "                  ", actionsById, renderedActionIds)).join("\n"),
    "                </div>"
  ].join("\n");
}

function renderBootstrapSection(section) {
  const elements = Array.isArray(section.elements) ? section.elements : [];
  const actions = Array.isArray(section.actions) ? section.actions : [];
  const actionsById = new Map(actions.map((action) => [action.id, action]));
  const renderedActionIds = new Set();
  const layout = bootstrapLayoutClasses(section);

  return [
    `      <section class="card spec-bs-section ${layout.classes}" id="section-${escapeAttribute(section.id)}" data-section-id="${escapeAttribute(section.id)}" ${layout.attrs}>`,
    '        <div class="card-body spec-bs-stack">',
    `          <h3 class="card-title">${escapeHtml(section.title || section.id)}</h3>`,
    elements.map((element) => renderBootstrapElement(element, "          ", actionsById, renderedActionIds)).join("\n"),
    actions
      .filter((action) => !renderedActionIds.has(action.id))
      .map((action) => renderBootstrapAction(action, "          "))
      .join("\n"),
    "        </div>",
    "      </section>"
  ].join("\n");
}

function renderBootstrapNav(items, actionsById, renderedActionIds, role) {
  const navClass = role === "nav" ? "nav flex-column" : "nav";

  return [
    `                <nav class="${navClass}" aria-label="${escapeAttribute(role)}">`,
    items.map((item) => renderBootstrapElement(item, "                  ", actionsById, renderedActionIds, { nav: true })).join("\n"),
    "                </nav>"
  ].join("\n");
}

function renderBootstrapCards(items, actionsById, renderedActionIds, role) {
  return [
    `                <div class="spec-bs-card-grid spec-bs-${escapeAttribute(role)}-grid">`,
    items.map((item) => renderBootstrapCard(item, "                  ", actionsById, renderedActionIds)).join("\n"),
    "                </div>"
  ].join("\n");
}

function renderBootstrapCard(item, indent, actionsById, renderedActionIds) {
  if (typeof item === "string") {
    return `${indent}<article class="card"><div class="card-body"><p class="card-text">${escapeHtml(item)}</p></div></article>`;
  }

  const type = item?.type || "text";
  const label = item?.label || item?.id || type;
  const props = item?.props || {};
  const value = props.value || props.price || props.status || "";
  const description = props.description || props.detail || "";
  const action = item?.action
    ? renderBootstrapElement(item, `${indent}  `, actionsById, renderedActionIds)
    : "";

  return [
    `${indent}<article class="card spec-bs-item-card spec-bs-${escapeAttribute(type)}" ${baseElementAttributes(item, type)}>`,
    `${indent}  <div class="card-body spec-bs-stack">`,
    value ? `${indent}    <strong>${escapeHtml(value)}</strong>` : "",
    `${indent}    <span>${escapeHtml(label)}</span>`,
    description ? `${indent}    <p class="card-text">${escapeHtml(description)}</p>` : "",
    action,
    `${indent}  </div>`,
    `${indent}</article>`
  ].filter(Boolean).join("\n");
}

function renderBootstrapDataTable(items, actionsById, renderedActionIds) {
  const columns = items.filter((item) => item?.type === "column");
  const rows = items.filter((item) => item?.type === "row");
  const extraItems = items.filter((item) => item?.type !== "column" && item?.type !== "row");
  const headers = columns.length > 0 ? columns : [{ id: "item", label: "Item" }];

  return [
    '                <div class="table-responsive">',
    '                  <table class="table">',
    "                    <thead>",
    "                      <tr>",
    headers
      .map((column) => `                        <th scope="col">${escapeHtml(column.label || column.id)}</th>`)
      .join("\n"),
    "                      </tr>",
    "                    </thead>",
    "                    <tbody>",
    rows.length > 0
      ? rows.map((row) => renderBootstrapTableRow(row, headers)).join("\n")
      : '                      <tr><td colspan="1">No rows</td></tr>',
    "                    </tbody>",
    "                  </table>",
    "                </div>",
    extraItems.map((item) => renderBootstrapElement(item, "                ", actionsById, renderedActionIds)).join("\n")
  ].filter(Boolean).join("\n");
}

function renderBootstrapTableRow(row, columns) {
  const props = row?.props || {};

  return [
    `                      <tr ${baseElementAttributes(row, "row")}>`,
    columns
      .map((column, index) => {
        const normalizedLabel = toPropKey(column.label);
        const value =
          props[column.id] ||
          props[column.label] ||
          props[normalizedLabel] ||
          props[`col${index + 1}`] ||
          (index === 0 ? row.label : "");
        return `                        <td>${escapeHtml(value)}</td>`;
      })
      .join("\n"),
    "                      </tr>"
  ].join("\n");
}

function renderBootstrapForm(items, actionsById, renderedActionIds) {
  return [
    '                <div class="row g-3">',
    items
      .map((item) => `                  <div class="col-12 col-lg-6">\n${renderBootstrapElement(item, "                    ", actionsById, renderedActionIds)}\n                  </div>`)
      .join("\n"),
    "                </div>"
  ].join("\n");
}

function renderBootstrapState(state, index, states) {
  const items = Array.isArray(state.items) ? state.items : [];
  const hidden = shouldHideState(state, index, states) ? " hidden" : "";
  const type = state.type || "default";
  const hasOverlay = type === "modal" || type === "confirmation";
  const wrapperStart = hasOverlay
    ? `      <div class="spec-bs-state-overlay" data-state-overlay="${escapeAttribute(state.id)}"${hidden}>`
    : "";
  const wrapperEnd = hasOverlay ? "      </div>" : "";
  const sectionHidden = hasOverlay ? "" : hidden;

  return [
    wrapperStart,
    `      <section class="card spec-bs-state spec-bs-state-${escapeAttribute(type)}" id="state-${escapeAttribute(state.id)}" data-state-id="${escapeAttribute(state.id)}" data-state-type="${escapeAttribute(type)}"${sectionHidden}>`,
    '        <div class="card-body spec-bs-stack">',
    `          <h3 class="card-title">${escapeHtml(state.label || state.title || state.id)}</h3>`,
    items.map((item) => renderBootstrapElement(item, "          ")).join("\n"),
    "        </div>",
    "      </section>",
    wrapperEnd
  ].filter(Boolean).join("\n");
}

function renderBootstrapElement(
  element,
  indent,
  actionsById = new Map(),
  renderedActionIds = new Set(),
  options = {}
) {
  if (typeof element === "string") {
    return `${indent}<p class="card-text spec-bs-text">${escapeHtml(element)}</p>`;
  }

  if (element?.action) {
    if (typeof element.action === "string") {
      const action = actionsById.get(element.action);
      if (action) {
        renderedActionIds.add(action.id);
        return renderBootstrapAction({ ...action, label: element.label }, indent, element.type, options);
      }
    }

    return renderBootstrapAction(
      {
        id: element.id,
        label: element.label,
        ...element.action
      },
      indent,
      element.type,
      options
    );
  }

  const type = element?.type || "text";
  const id = element?.id || type;
  const label = element?.label || id;
  const attrs = baseElementAttributes(element, type);

  if (type === "input" || type === "field" || type === "select") {
    const placeholder = element?.props?.placeholder || label;
    const control = type === "select"
      ? `<select class="form-select"><option>${escapeHtml(placeholder)}</option></select>`
      : `<input class="form-control" placeholder="${escapeAttribute(placeholder)}">`;
    return `${indent}<label class="form-label spec-bs-element" ${attrs}><span>${escapeHtml(label)}</span>${control}</label>`;
  }

  if (type === "toggle") {
    return `${indent}<label class="form-check spec-bs-element" ${attrs}><input type="checkbox"><span>${escapeHtml(label)}</span></label>`;
  }

  if (type === "badge" || type === "logo") {
    return `${indent}<span class="badge spec-bs-element" ${attrs}>${escapeHtml(label)}</span>`;
  }

  if (type === "headline") {
    return `${indent}<h2 class="display-6 spec-bs-element" ${attrs}>${escapeHtml(label)}</h2>`;
  }

  if (type === "subhead") {
    return `${indent}<p class="lead spec-bs-element" ${attrs}>${escapeHtml(label)}</p>`;
  }

  if (type === "list" || type === "activity" || type === "step" || type === "faq-item") {
    return `${indent}<div class="list-group-item spec-bs-element spec-bs-${escapeAttribute(type)}" ${attrs}>${escapeHtml(label)}</div>`;
  }

  if (options.nav || type === "nav-item" || type === "tab") {
    return `${indent}<span class="nav-link spec-bs-element" ${attrs}>${escapeHtml(label)}</span>`;
  }

  return `${indent}<p class="card-text spec-bs-element spec-bs-${escapeAttribute(type)}" ${attrs}>${escapeHtml(label)}</p>`;
}

function renderBootstrapAction(action, indent, elementType = "button", options = {}) {
  const id = action?.id || `${action?.type || "action"}-${action?.target || "target"}`;
  const label = action?.label || id;
  const type = action?.type || "";
  const target = action?.target || "";
  const classes = options.nav || elementType === "nav-item" || elementType === "tab"
    ? "nav-link spec-bs-action"
    : "btn btn-primary spec-bs-action";

  return `${indent}<button class="${classes}" data-element-id="${escapeAttribute(id)}" data-element-type="${escapeAttribute(elementType)}" data-action-type="${escapeAttribute(type)}" data-action-target="${escapeAttribute(target)}" type="button">${escapeHtml(label)}</button>`;
}

function bootstrapRegionColumn(type, shell) {
  if (shell === "marketing") return "col-12";
  if (type === "sidebar") return "col-12 col-lg-2";
  if (type === "topbar") return "col-12 col-lg-10";
  if (type === "content" || type === "main") return "col-12 col-lg-8";
  if (type === "aside") return "col-12 col-lg-4";
  if (type === "footer") return "col-12";
  return "col-12";
}

function bootstrapBlockClass(type) {
  if (type === "hero" || type === "cta") return "spec-bs-marketing-hero";
  if (type === "metric-row") return "spec-bs-metric";
  if (type === "navbar") return "spec-bs-navbar";
  return "";
}

function shouldRenderBootstrapBlockTitle(type) {
  return type !== "hero" && type !== "navbar";
}

function bootstrapGapClass(gap) {
  const classes = {
    none: "g-0",
    xs: "g-1",
    sm: "g-2",
    md: "g-3",
    lg: "g-4",
    xl: "g-5"
  };

  return classes[gap] || classes.md;
}

function bootstrapLayoutClasses(node) {
  const controls = readLayoutControls(node);
  const classes = [];
  const attrs = [];

  for (const [name, value] of Object.entries(controls)) {
    const normalized = String(value);
    attrs.push(`data-layout-${toPropKey(name)}="${escapeAttribute(normalized)}"`);

    if (name === "padding") classes.push(`spec-bs-pad-${normalized}`);
    if (name === "density") classes.push(`spec-bs-density-${normalized}`);
    if (name === "width") classes.push(`spec-bs-width-${normalized}`);
    if (name === "align") classes.push(`spec-bs-align-${normalized}`);
    if (name === "columns" && normalized !== "auto") classes.push(`spec-bs-columns-${normalized}`);
    if (name === "collapse") classes.push(`spec-bs-collapse-${normalized}`);
    if (name === "text") classes.push(`spec-bs-text-${normalized}`);
    if (name === "overflow") classes.push(`spec-bs-overflow-${normalized}`);
  }

  return {
    classes: classes.join(" "),
    attrs: attrs.join(" ")
  };
}

function readLayoutControls(node) {
  const controls = node?.layoutControls ?? node?.layout ?? node?.controls ?? {};

  if (Array.isArray(controls)) {
    return Object.fromEntries(
      controls
        .map((control) => [
          control.name ?? control.control ?? control.key,
          control.value
        ])
        .filter(([name, value]) => name && value !== undefined)
    );
  }

  return Object.fromEntries(
    Object.entries(controls ?? {})
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([name, value]) => [
        name,
        value && typeof value === "object" && "value" in value
          ? value.value
          : value
      ])
  );
}

function readBootstrapTokens(ir) {
  const tokens =
    ir?.metadata?.tokens ??
    ir?.metadata?.theme?.tokens ??
    ir?.tokens ??
    {};

  if (Array.isArray(tokens)) {
    const entries = [];

    for (const token of tokens) {
      for (const control of token.controls ?? [token]) {
        const name =
          control.type === "tone"
            ? control.target || control.name || "tone"
            : control.type || control.name || control.token || control.key;
        if (name && control.value !== undefined) entries.push([name, control.value]);
      }
    }

    return Object.fromEntries(entries);
  }

  return Object.fromEntries(
    Object.entries(tokens ?? {}).filter(([, value]) => typeof value === "string")
  );
}

function bootstrapTokenClasses(tokens) {
  const classes = [];
  const tone = tokens.tone ?? tokens.brand;
  const cards = tokens.treatment ?? tokens.cards;

  if (tone) classes.push(`spec-bs-tone-${tone}`);
  if (tokens.radius) classes.push(`spec-bs-radius-${tokens.radius}`);
  if (tokens.density) classes.push(`spec-bs-density-${tokens.density}`);
  if (cards) classes.push(`spec-bs-cards-${cards}`);

  return classes;
}

function normalizeElementAction(element) {
  if (!element?.action) return null;
  if (typeof element.action === "string") return null;
  return {
    id: element.id,
    label: element.label,
    ...element.action
  };
}

function bootstrapScript() {
  return script().replaceAll("spec-ui", "spec-bs");
}

function renderScreen(screen, isActive) {
  const sections = Array.isArray(screen.sections) ? screen.sections : [];
  const states = Array.isArray(screen.states) ? screen.states : [];
  const regions = Array.isArray(screen.regions) ? screen.regions : [];
  const hidden = isActive ? "" : " hidden";

  if (regions.length > 0) {
    return renderSemanticScreen(screen, regions, states, hidden);
  }

  return [
    `    <section class="spec-ui-screen" id="screen-${escapeAttribute(screen.id)}" data-screen-id="${escapeAttribute(screen.id)}"${hidden}>`,
    `      <header class="spec-ui-screen-header"><h2>${escapeHtml(screen.title || screen.id)}</h2></header>`,
    sections.map(renderSection).join("\n"),
    states.map((state, index) => renderState(state, index, states)).join("\n"),
    "    </section>"
  ].join("\n");
}

function renderSemanticScreen(screen, regions, states, hidden) {
  const shell = screen.shell || "none";
  const kind = screen.kind || "default";
  const gap = screen.gap || "md";

  return [
    `    <section class="spec-ui-screen spec-ui-screen-${escapeAttribute(shell)}" id="screen-${escapeAttribute(screen.id)}" data-screen-id="${escapeAttribute(screen.id)}" data-screen-shell="${escapeAttribute(shell)}" data-screen-kind="${escapeAttribute(kind)}" data-gap="${escapeAttribute(gap)}"${hidden}>`,
    `      <header class="spec-ui-screen-header spec-ui-screen-header-${escapeAttribute(shell)}"><h2>${escapeHtml(screen.title || screen.id)}</h2></header>`,
    `      <div class="spec-ui-regions spec-ui-${escapeAttribute(shell)}-layout" style="${gapStyle(gap)}">`,
    regions.map((region) => renderRegion(region, shell)).join("\n"),
    "      </div>",
    states.map((state, index) => renderState(state, index, states)).join("\n"),
    "    </section>"
  ].join("\n");
}

function renderRegion(region, shell) {
  const blocks = Array.isArray(region.blocks) ? region.blocks : [];
  const type = region.type || region.id || "region";
  const gap = region.gap || "md";

  return [
    `        <section class="spec-ui-region spec-ui-region-${escapeAttribute(type)}" id="region-${escapeAttribute(region.id || type)}" data-region-id="${escapeAttribute(region.id || type)}" data-region-type="${escapeAttribute(type)}" data-region-shell="${escapeAttribute(shell)}" data-gap="${escapeAttribute(gap)}" style="${gapStyle(gap)}">`,
    region.title || region.label
      ? `          <h3 class="spec-ui-region-title">${escapeHtml(region.title || region.label)}</h3>`
      : "",
    blocks.map((block) => renderBlock(block)).join("\n"),
    "        </section>"
  ].filter(Boolean).join("\n");
}

function renderBlock(block) {
  const type = block?.type || "block";
  const id = block?.id || type;
  const title = block?.title || block?.label || id;
  const items = Array.isArray(block?.items) ? block.items : [];
  const actions = Array.isArray(block?.actions) ? block.actions : [];
  const states = Array.isArray(block?.states) ? block.states : [];
  const actionsById = new Map(actions.map((action) => [action.id, action]));
  const renderedActionIds = new Set();
  const gap = block?.gap || "md";
  const variant = block?.variant
    ? ` data-block-variant="${escapeAttribute(block.variant)}"`
    : "";

  const body = renderBlockBody(type, items, actions, actionsById, renderedActionIds);

  return [
    `          <section class="spec-ui-block spec-ui-block-${escapeAttribute(type)}" id="block-${escapeAttribute(id)}" data-block-id="${escapeAttribute(id)}" data-block-type="${escapeAttribute(type)}" data-gap="${escapeAttribute(gap)}" style="${gapStyle(gap)}"${variant}>`,
    `            <header class="spec-ui-block-header"><h4>${escapeHtml(title)}</h4></header>`,
    body,
    states.map((state, index) => renderState(state, index, states)).join("\n"),
    "          </section>"
  ].filter(Boolean).join("\n");
}

function renderBlockBody(type, items, actions, actionsById, renderedActionIds) {
  if (type === "nav" || type === "navbar") {
    return renderItemList(items, actions, actionsById, renderedActionIds, "nav");
  }

  if (type === "metric-row") {
    return renderSemanticCards(items, actions, actionsById, renderedActionIds, "metric");
  }

  if (type === "data-table") {
    return renderDataTable(items, actions, actionsById, renderedActionIds);
  }

  if (type === "form" || type === "settings-group" || type === "contact-form" || type === "signup-form" || type === "filters") {
    return renderFormLike(items, actions, actionsById, renderedActionIds);
  }

  if (type === "pricing") {
    return renderSemanticCards(items, actions, actionsById, renderedActionIds, "pricing");
  }

  if (type === "feature-grid" || type === "collection-list" || type === "onboarding-steps" || type === "activity-feed" || type === "logo-cloud" || type === "testimonial-group" || type === "faq") {
    return renderSemanticCards(items, actions, actionsById, renderedActionIds, type);
  }

  if (type === "tabs") {
    return renderItemList(items, actions, actionsById, renderedActionIds, "tabs");
  }

  return renderItemList(items, actions, actionsById, renderedActionIds, type);
}

function renderItemList(items, actions, actionsById, renderedActionIds, role) {
  return [
    `            <div class="spec-ui-block-body spec-ui-${escapeAttribute(role)}-body">`,
    items
      .map((item) =>
        renderElement(item, "              ", actionsById, renderedActionIds)
      )
      .join("\n"),
    actions
      .filter((action) => !renderedActionIds.has(action.id))
      .map((action) => renderAction(action, "              "))
      .join("\n"),
    "            </div>"
  ].join("\n");
}

function renderSemanticCards(items, actions, actionsById, renderedActionIds, role) {
  return [
    `            <div class="spec-ui-block-body spec-ui-card-grid spec-ui-${escapeAttribute(role)}-grid">`,
    items
      .map((item) => renderSemanticCard(item, "              ", actionsById, renderedActionIds))
      .join("\n"),
    actions
      .filter((action) => !renderedActionIds.has(action.id))
      .map((action) => renderAction(action, "              "))
      .join("\n"),
    "            </div>"
  ].join("\n");
}

function renderSemanticCard(item, indent, actionsById, renderedActionIds) {
  if (typeof item === "string") {
    return `${indent}<article class="spec-ui-card"><p>${escapeHtml(item)}</p></article>`;
  }

  const type = item?.type || "text";
  const label = item?.label || item?.id || type;
  const props = item?.props || {};
  const value = props.value || props.price || props.status || "";
  const description = props.description || props.detail || "";
  const action = item?.action
    ? renderElement(item, `${indent}  `, actionsById, renderedActionIds)
    : "";

  return [
    `${indent}<article class="spec-ui-card spec-ui-card-${escapeAttribute(type)}" ${baseElementAttributes(item, type)}>`,
    value ? `${indent}  <strong>${escapeHtml(value)}</strong>` : "",
    `${indent}  <span>${escapeHtml(label)}</span>`,
    description ? `${indent}  <p>${escapeHtml(description)}</p>` : "",
    action,
    `${indent}</article>`
  ].filter(Boolean).join("\n");
}

function renderDataTable(items, actions, actionsById, renderedActionIds) {
  const columns = items.filter((item) => item?.type === "column");
  const rows = items.filter((item) => item?.type === "row");
  const extraItems = items.filter((item) => item?.type !== "column" && item?.type !== "row");
  const headers = columns.length > 0 ? columns : [{ id: "item", label: "Item" }];

  return [
    '            <div class="spec-ui-block-body spec-ui-table-wrap">',
    '              <table class="spec-ui-table">',
    "                <thead>",
    "                  <tr>",
    headers
      .map((column) => `                    <th scope="col">${escapeHtml(column.label || column.id)}</th>`)
      .join("\n"),
    "                  </tr>",
    "                </thead>",
    "                <tbody>",
    rows.length > 0
      ? rows.map((row) => renderTableRow(row, headers)).join("\n")
      : '                  <tr><td colspan="1">No rows</td></tr>',
    "                </tbody>",
    "              </table>",
    extraItems.map((item) => renderElement(item, "              ", actionsById, renderedActionIds)).join("\n"),
    actions
      .filter((action) => !renderedActionIds.has(action.id))
      .map((action) => renderAction(action, "              "))
      .join("\n"),
    "            </div>"
  ].filter(Boolean).join("\n");
}

function renderTableRow(row, columns) {
  const props = row?.props || {};

  return [
    `                  <tr ${baseElementAttributes(row, "row")}>`,
    columns
      .map((column, index) => {
        const normalizedLabel = toPropKey(column.label);
        const value =
          props[column.id] ||
          props[column.label] ||
          props[normalizedLabel] ||
          props[`col${index + 1}`] ||
          (index === 0 ? row.label : "");
        return `                    <td>${escapeHtml(value)}</td>`;
      })
      .join("\n"),
    "                  </tr>"
  ].join("\n");
}

function renderFormLike(items, actions, actionsById, renderedActionIds) {
  return [
    '            <div class="spec-ui-block-body spec-ui-form-grid">',
    items
      .map((item) =>
        renderElement(item, "              ", actionsById, renderedActionIds)
      )
      .join("\n"),
    actions
      .filter((action) => !renderedActionIds.has(action.id))
      .map((action) => renderAction(action, "              "))
      .join("\n"),
    "            </div>"
  ].join("\n");
}

function renderSection(section) {
  const elements = Array.isArray(section.elements) ? section.elements : [];
  const actions = Array.isArray(section.actions) ? section.actions : [];
  const actionsById = new Map(actions.map((action) => [action.id, action]));
  const renderedActionIds = new Set();

  return [
    `      <section class="spec-ui-section" id="section-${escapeAttribute(section.id)}" data-section-id="${escapeAttribute(section.id)}">`,
    `        <h3>${escapeHtml(section.title || section.id)}</h3>`,
    '        <div class="spec-ui-elements">',
    elements
      .map((element) =>
        renderElement(element, "          ", actionsById, renderedActionIds)
      )
      .join("\n"),
    actions
      .filter((action) => !renderedActionIds.has(action.id))
      .map((action) => renderAction(action, "          "))
      .join("\n"),
    "        </div>",
    "      </section>"
  ].join("\n");
}

function renderState(state, index, states) {
  const items = Array.isArray(state.items) ? state.items : [];
  const hidden = shouldHideState(state, index, states) ? " hidden" : "";
  const type = state.type || "default";
  const hasOverlay = type === "modal" || type === "confirmation";
  const wrapperStart = hasOverlay
    ? `      <div class="spec-ui-state-overlay" data-state-overlay="${escapeAttribute(state.id)}"${hidden}>`
    : "";
  const wrapperEnd = hasOverlay ? "      </div>" : "";
  const sectionHidden = hasOverlay ? "" : hidden;

  return [
    wrapperStart,
    `      <section class="spec-ui-state spec-ui-state-${escapeAttribute(type)}" id="state-${escapeAttribute(state.id)}" data-state-id="${escapeAttribute(state.id)}" data-state-type="${escapeAttribute(type)}"${sectionHidden}>`,
    `        <h3>${escapeHtml(state.label || state.title || state.id)}</h3>`,
    '        <div class="spec-ui-elements">',
    items.map((item) => renderElement(item, "          ")).join("\n"),
    "        </div>",
    "      </section>",
    wrapperEnd
  ].filter(Boolean).join("\n");
}

function shouldHideState(state, index, states) {
  const type = state.type || "default";
  if (type === "tab") {
    return states.findIndex((candidate) => candidate.type === "tab") !== index;
  }
  return STATE_TYPES_HIDDEN_BY_DEFAULT.has(type);
}

function renderElement(
  element,
  indent,
  actionsById = new Map(),
  renderedActionIds = new Set()
) {
  if (typeof element === "string") {
    return `${indent}<p class="spec-ui-element spec-ui-text">${escapeHtml(element)}</p>`;
  }

  if (element?.action) {
    if (typeof element.action === "string") {
      const action = actionsById.get(element.action);
      if (action) {
        renderedActionIds.add(action.id);
        return renderAction({ ...action, label: element.label }, indent, element.type);
      }
    }

    return renderAction(
      {
        id: element.id,
        label: element.label,
        ...element.action
      },
      indent,
      element.type
    );
  }

  const type = element?.type || "text";
  const id = element?.id || type;
  const label = element?.label || id;
  const attrs = baseElementAttributes(element, type);

  if (type === "input" || type === "field" || type === "select") {
    const placeholder = element?.props?.placeholder || label;
    const control = type === "select"
      ? `<select><option>${escapeHtml(placeholder)}</option></select>`
      : `<input placeholder="${escapeAttribute(placeholder)}">`;
    return `${indent}<label class="spec-ui-element spec-ui-field" ${attrs}><span>${escapeHtml(label)}</span>${control}</label>`;
  }

  if (type === "toggle") {
    return `${indent}<label class="spec-ui-element spec-ui-toggle" ${attrs}><input type="checkbox"><span>${escapeHtml(label)}</span></label>`;
  }

  if (type === "badge" || type === "logo") {
    return `${indent}<span class="spec-ui-element spec-ui-badge" ${attrs}>${escapeHtml(label)}</span>`;
  }

  if (type === "list") {
    return `${indent}<div class="spec-ui-element spec-ui-list" ${attrs}>${escapeHtml(label)}</div>`;
  }

  return `${indent}<p class="spec-ui-element spec-ui-${escapeAttribute(type)}" ${attrs}>${escapeHtml(label)}</p>`;
}

function renderAction(action, indent, elementType = "button") {
  const id = action?.id || `${action?.type || "action"}-${action?.target || "target"}`;
  const label = action?.label || id;
  const type = action?.type || "";
  const target = action?.target || "";
  const tag = elementType === "button" || elementType === "action" ? "button" : "button";

  return `${indent}<${tag} class="spec-ui-element spec-ui-action" data-element-id="${escapeAttribute(id)}" data-element-type="${escapeAttribute(elementType)}" data-action-type="${escapeAttribute(type)}" data-action-target="${escapeAttribute(target)}" type="button">${escapeHtml(label)}</${tag}>`;
}

function baseElementAttributes(element, type) {
  return `data-element-id="${escapeAttribute(element?.id || type)}" data-element-type="${escapeAttribute(type)}"`;
}

function stylesheet() {
  return `    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f7f9; color: #1f2933; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    [hidden] { display: none !important; }
    .spec-ui-shell { width: min(1120px, calc(100vw - 32px)); margin: 0 auto; padding: 32px 0 48px; }
    .spec-ui-screen { display: grid; gap: 16px; }
    .spec-ui-screen-app { grid-template-rows: auto 1fr; }
    .spec-ui-screen-marketing { gap: 0; background: #ffffff; border: 1px solid #d7dde5; border-radius: 8px; overflow: hidden; }
    .spec-ui-screen-header, .spec-ui-section, .spec-ui-state, .spec-ui-region, .spec-ui-block { min-width: 0; background: #ffffff; border: 1px solid #d7dde5; border-radius: 8px; padding: 18px; box-shadow: 0 1px 2px rgb(31 41 51 / 0.06); }
    .spec-ui-screen-header-marketing { border: 0; border-bottom: 1px solid #d7dde5; border-radius: 0; box-shadow: none; }
    h1, h2, h3, h4, p { margin: 0; }
    h1 { font-size: 1.65rem; margin-bottom: 18px; }
    h2 { font-size: 1.25rem; }
    h3 { font-size: 1rem; margin-bottom: 12px; }
    h4 { font-size: 0.95rem; margin-bottom: 12px; }
    .spec-ui-elements { min-width: 0; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .spec-ui-element { min-width: 0; min-height: 36px; display: inline-flex; align-items: center; gap: 8px; overflow-wrap: anywhere; }
    .spec-ui-text, .spec-ui-empty, .spec-ui-loading, .spec-ui-success, .spec-ui-error, .spec-ui-list, .spec-ui-headline, .spec-ui-subhead, .spec-ui-feature, .spec-ui-activity, .spec-ui-step, .spec-ui-faq-item, .spec-ui-testimonial, .spec-ui-quote { width: 100%; padding: 8px 0; }
    .spec-ui-action { border: 1px solid #516070; border-radius: 6px; background: #243447; color: #ffffff; padding: 8px 12px; font: inherit; cursor: pointer; }
    .spec-ui-field { width: min(360px, 100%); flex-direction: column; align-items: stretch; }
    .spec-ui-field input, .spec-ui-field select { min-height: 36px; border: 1px solid #a8b3c1; border-radius: 6px; padding: 8px 10px; font: inherit; background: #ffffff; }
    .spec-ui-toggle { border: 1px solid #d7dde5; border-radius: 6px; padding: 8px 10px; }
    .spec-ui-badge { border-radius: 999px; background: #e7eef7; color: #21364d; padding: 6px 10px; }
    .spec-ui-regions { display: grid; gap: var(--spec-ui-gap, 14px); }
    .spec-ui-app-layout { grid-template-columns: minmax(190px, 0.25fr) minmax(0, 1fr) minmax(180px, 0.28fr); grid-template-areas: "sidebar topbar topbar" "sidebar content aside" "sidebar footer footer"; align-items: start; }
    .spec-ui-marketing-layout { gap: 0; grid-template-columns: minmax(0, 1fr); grid-template-areas: "navbar" "content" "footer"; }
    .spec-ui-screen-marketing .spec-ui-region { border: 0; border-radius: 0; box-shadow: none; }
    .spec-ui-region-sidebar { grid-area: sidebar; }
    .spec-ui-region-navbar { grid-area: navbar; }
    .spec-ui-region-topbar { grid-area: topbar; }
    .spec-ui-region-content, .spec-ui-region-main { grid-area: content; }
    .spec-ui-region-aside { grid-area: aside; }
    .spec-ui-region-footer { grid-area: footer; }
    .spec-ui-region-title { color: #516070; font-size: 0.78rem; letter-spacing: 0; text-transform: uppercase; }
    .spec-ui-region, .spec-ui-block-body { min-width: 0; display: grid; gap: var(--spec-ui-gap, 12px); }
    .spec-ui-block-header h4 { color: #243447; }
    .spec-ui-nav-body, .spec-ui-navbar-body, .spec-ui-tabs-body { display: flex; flex-wrap: wrap; gap: var(--spec-ui-gap, 8px); align-items: center; }
    .spec-ui-region-sidebar .spec-ui-nav-body { align-items: stretch; flex-direction: column; }
    .spec-ui-card-grid { min-width: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(190px, 100%), 1fr)); gap: var(--spec-ui-gap, 12px); }
    .spec-ui-card { min-width: 0; min-height: 92px; display: grid; gap: 6px; align-content: start; border: 1px solid #d7dde5; border-radius: 8px; padding: 14px; background: #fbfcfd; overflow-wrap: anywhere; }
    .spec-ui-card strong { color: #0f766e; font-size: 1.35rem; }
    .spec-ui-card p { color: #516070; line-height: 1.45; }
    .spec-ui-block-hero, .spec-ui-block-cta { background: #f8fbff; border-color: #c7d7ea; }
    .spec-ui-block-hero .spec-ui-block-body, .spec-ui-block-cta .spec-ui-block-body { max-width: 720px; }
    .spec-ui-block-hero .spec-ui-headline { font-size: 2rem; font-weight: 700; line-height: 1.08; color: #102033; }
    .spec-ui-block-hero .spec-ui-subhead, .spec-ui-block-cta .spec-ui-subhead { color: #516070; font-size: 1.05rem; line-height: 1.5; }
    .spec-ui-table-wrap { overflow-x: auto; }
    .spec-ui-table { width: 100%; border-collapse: collapse; min-width: 420px; }
    .spec-ui-table th, .spec-ui-table td { border-bottom: 1px solid #d7dde5; padding: 10px; text-align: left; vertical-align: top; }
    .spec-ui-table th { color: #516070; font-size: 0.82rem; font-weight: 700; }
    .spec-ui-form-grid { min-width: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap: var(--spec-ui-gap, 12px); align-items: end; }
    .spec-ui-state-overlay { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 24px; background: rgb(31 41 51 / 0.38); }
    .spec-ui-state-modal, .spec-ui-state-confirmation { width: min(460px, calc(100vw - 48px)); max-height: calc(100vh - 48px); overflow: auto; border-color: #516070; }
    .spec-ui-state-drawer { position: fixed; inset: 24px 24px 24px auto; width: min(420px, calc(100vw - 48px)); z-index: 21; overflow: auto; border-color: #516070; }
    .spec-ui-state-confirmation { border-color: #9a3412; }
    @media (max-width: 860px) {
      .spec-ui-shell { width: min(100% - 16px, 720px); padding-top: 16px; }
      .spec-ui-app-layout { grid-template-columns: minmax(0, 1fr); grid-template-areas: "sidebar" "topbar" "content" "aside" "footer"; }
      .spec-ui-region-sidebar .spec-ui-nav-body { flex-direction: row; }
      .spec-ui-screen-header, .spec-ui-section, .spec-ui-state, .spec-ui-region, .spec-ui-block { padding: 14px; }
    }`;
}

function script() {
  return `    (() => {
      function setHidden(element, hidden) {
        element.hidden = hidden;
        element.setAttribute("aria-hidden", hidden ? "true" : "false");
        const overlay = element.closest("[data-state-overlay]");
        if (overlay) {
          overlay.hidden = hidden;
          overlay.setAttribute("aria-hidden", hidden ? "true" : "false");
        }
      }

      function statesInScope(trigger) {
        const screen = trigger.closest("[data-screen-id]");
        return Array.from((screen || document).querySelectorAll("[data-state-id]"));
      }

      function findState(trigger, target) {
        return statesInScope(trigger).find((state) => state.dataset.stateId === target)
          || Array.from(document.querySelectorAll("[data-state-id]")).find((state) => state.dataset.stateId === target);
      }

      function clearTransientOverlayStates(trigger) {
        if (!trigger.closest("[data-state-overlay]")) return;
        for (const state of statesInScope(trigger)) {
          const stateType = state.dataset.stateType;
          if (stateType === "success" || stateType === "error" || stateType === "empty" || stateType === "loading") {
            setHidden(state, true);
          }
        }
      }

      function showScreen(target) {
        for (const screen of document.querySelectorAll("[data-screen-id]")) {
          setHidden(screen, screen.dataset.screenId !== target);
        }
        for (const state of document.querySelectorAll("[data-state-id]")) {
          if (state.dataset.stateType !== "tab") setHidden(state, true);
        }
      }

      function showState(trigger, target) {
        const state = findState(trigger, target);
        if (!state) return;
        const type = state.dataset.stateType;
        for (const candidate of statesInScope(trigger)) {
          const candidateType = candidate.dataset.stateType;
          const exclusiveOverlay = type === "modal" || type === "confirmation";
          if (candidate !== state && (candidateType === type || (exclusiveOverlay && (candidateType === "modal" || candidateType === "confirmation")))) {
            setHidden(candidate, true);
          }
        }
        setHidden(state, false);
      }

      document.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-action-type]");
        if (!trigger) return;
        const type = trigger.dataset.actionType;
        const target = trigger.dataset.actionTarget;
        if (type === "navigate") showScreen(target);
        if (type === "open-modal" || type === "show-state" || type === "set-tab") showState(trigger, target);
        if (type === "close-modal") {
          const state = findState(trigger, target);
          if (state) setHidden(state, true);
          clearTransientOverlayStates(trigger);
        }
        if (type === "toggle") {
          const state = findState(trigger, target);
          if (state) setHidden(state, !state.hidden);
        }
      });
    })();`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function gapStyle(gap) {
  return `--spec-ui-gap: ${gapToCss(gap)}`;
}

function gapToCss(gap) {
  const values = {
    none: "0",
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "18px",
    xl: "28px"
  };

  return values[gap] || values.md;
}

function toPropKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
