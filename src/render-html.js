import { SPEC_UI_VERSION } from "./contracts.js";

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

export function renderHtml(ir) {
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
