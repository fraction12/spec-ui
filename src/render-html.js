import { SPEC_UI_VERSION } from "./contracts.js";

const STATE_TYPES_HIDDEN_BY_DEFAULT = new Set([
  "empty",
  "error",
  "loading",
  "modal",
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
  const hidden = isActive ? "" : " hidden";

  return [
    `    <section class="spec-ui-screen" id="screen-${escapeAttribute(screen.id)}" data-screen-id="${escapeAttribute(screen.id)}"${hidden}>`,
    `      <header class="spec-ui-screen-header"><h2>${escapeHtml(screen.title || screen.id)}</h2></header>`,
    sections.map(renderSection).join("\n"),
    states.map((state, index) => renderState(state, index, states)).join("\n"),
    "    </section>"
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

  return [
    `      <section class="spec-ui-state spec-ui-state-${escapeAttribute(state.type || "default")}" id="state-${escapeAttribute(state.id)}" data-state-id="${escapeAttribute(state.id)}" data-state-type="${escapeAttribute(state.type || "default")}"${hidden}>`,
    `        <h3>${escapeHtml(state.label || state.title || state.id)}</h3>`,
    '        <div class="spec-ui-elements">',
    items.map((item) => renderElement(item, "          ")).join("\n"),
    "        </div>",
    "      </section>"
  ].join("\n");
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

  if (type === "input" || type === "field") {
    const placeholder = element?.props?.placeholder || label;
    return `${indent}<label class="spec-ui-element spec-ui-field" ${attrs}><span>${escapeHtml(label)}</span><input placeholder="${escapeAttribute(placeholder)}"></label>`;
  }

  if (type === "badge") {
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
    .spec-ui-screen-header, .spec-ui-section, .spec-ui-state { background: #ffffff; border: 1px solid #d7dde5; border-radius: 8px; padding: 18px; box-shadow: 0 1px 2px rgb(31 41 51 / 0.06); }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 1.65rem; margin-bottom: 18px; }
    h2 { font-size: 1.25rem; }
    h3 { font-size: 1rem; margin-bottom: 12px; }
    .spec-ui-elements { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .spec-ui-element { min-height: 36px; display: inline-flex; align-items: center; gap: 8px; }
    .spec-ui-text, .spec-ui-empty, .spec-ui-loading, .spec-ui-success, .spec-ui-error, .spec-ui-list { width: 100%; padding: 8px 0; }
    .spec-ui-action { border: 1px solid #516070; border-radius: 6px; background: #243447; color: #ffffff; padding: 8px 12px; font: inherit; cursor: pointer; }
    .spec-ui-field { width: min(360px, 100%); flex-direction: column; align-items: stretch; }
    .spec-ui-field input { min-height: 36px; border: 1px solid #a8b3c1; border-radius: 6px; padding: 8px 10px; font: inherit; }
    .spec-ui-badge { border-radius: 999px; background: #e7eef7; color: #21364d; padding: 6px 10px; }
    .spec-ui-state-modal { position: fixed; inset: auto 24px 24px auto; width: min(420px, calc(100vw - 48px)); z-index: 10; border-color: #516070; }`;
}

function script() {
  return `    (() => {
      function setHidden(element, hidden) {
        element.hidden = hidden;
        element.setAttribute("aria-hidden", hidden ? "true" : "false");
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
      }

      function showState(trigger, target) {
        const state = findState(trigger, target);
        if (!state) return;
        const type = state.dataset.stateType;
        for (const candidate of statesInScope(trigger)) {
          if (candidate.dataset.stateType === type && candidate !== state && type !== "modal") {
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
