import { RESERVED_HTML_PATTERN } from "./contracts.js";

const SPEC_RE = /^# Spec:\s*(.+?)\s*$/;
const SCREEN_RE = /^## Screen:\s*(.+?)\s*$/;
const SECTION_RE = /^### Section:\s*(.+?)\s*$/;
const STATE_RE = /^#### State:\s*(.+?)\s*$/;
const ITEM_RE = /^-\s*([A-Za-z][A-Za-z0-9-]*)#([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.+?)\s*$/;

export function parseSpec(markdown) {
  const source = {
    title: "",
    line: undefined,
    screens: [],
    errors: []
  };

  const lines = String(markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
  const firstContent = lines.findIndex((line) => line.trim() !== "");

  if (firstContent >= 0) {
    const firstLine = lines[firstContent].trim();
    const specMatch = firstLine.match(SPEC_RE);
    if (specMatch) {
      source.title = specMatch[1].trim();
      source.line = firstContent + 1;
    } else {
      source.errors.push({
        code: "missing_spec_title",
        message: 'First non-empty line must be "# Spec: <title>".',
        line: firstContent + 1
      });
    }
  }

  let currentScreen = null;
  let currentSection = null;
  let currentState = null;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (line === "") return;
    if (line.match(SPEC_RE)) return;

    if (RESERVED_HTML_PATTERN.test(line)) {
      source.errors.push({
        code: "raw_html",
        message: "Raw HTML is not supported in Spec UI markdown.",
        line: lineNumber
      });
      return;
    }

    const screen = parseHeading(line, SCREEN_RE);
    if (screen) {
      currentScreen = {
        id: screen.attrs.id ?? "",
        title: screen.title,
        line: lineNumber,
        sections: [],
        states: []
      };
      source.screens.push(currentScreen);
      currentSection = null;
      currentState = null;
      return;
    }

    const section = parseHeading(line, SECTION_RE);
    if (section) {
      if (!currentScreen) {
        source.errors.push({
          code: "section_outside_screen",
          message: "Section must be declared inside a screen.",
          line: lineNumber
        });
        currentSection = null;
        currentState = null;
        return;
      }

      currentSection = {
        id: section.attrs.id ?? "",
        title: section.title,
        line: lineNumber,
        elements: [],
        actions: []
      };
      currentScreen.sections.push(currentSection);
      currentState = null;
      return;
    }

    const state = parseHeading(line, STATE_RE);
    if (state) {
      if (!currentScreen) {
        source.errors.push({
          code: "state_outside_screen",
          message: "State must be declared inside a screen.",
          line: lineNumber
        });
        currentSection = null;
        currentState = null;
        return;
      }

      currentState = {
        id: state.attrs.id ?? "",
        type: state.attrs.type ?? "default",
        label: state.title,
        line: lineNumber,
        items: []
      };
      currentScreen.states.push(currentState);
      currentSection = null;
      return;
    }

    const item = parseItem(line, lineNumber);
    if (item) {
      if (currentState) {
        currentState.items.push(toElement(item));
        return;
      }

      if (currentSection) {
        if (item.type === "action") {
          currentSection.actions.push(toAction(item));
        } else {
          currentSection.elements.push(toElement(item));
        }
        return;
      }

      source.errors.push({
        code: "element_outside_section_or_state",
        message: "Element must be declared inside a section or state.",
        line: lineNumber
      });
      return;
    }

    source.errors.push({
      code: "unrecognized_structure",
      message: "Line does not match supported Spec UI markdown structure.",
      line: lineNumber
    });
  });

  return source;
}

function parseHeading(line, regex) {
  const match = line.match(regex);
  if (!match) return null;

  const { text, attrs } = extractAttrs(match[1]);
  return {
    title: text,
    attrs
  };
}

function parseItem(line, lineNumber) {
  const match = line.match(ITEM_RE);
  if (!match) return null;

  const { text, attrs } = extractAttrs(match[3], lineNumber);
  return {
    type: match[1],
    id: match[2],
    label: text,
    attrs,
    line: lineNumber
  };
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

  const idColon = inner.match(/^id:\s*([A-Za-z][A-Za-z0-9_-]*)$/);
  if (idColon) {
    attrs.id = idColon[1];
    return attrs;
  }

  for (const match of inner.matchAll(/([A-Za-z][A-Za-z0-9_-]*)="([^"]*)"/g)) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

function toElement(item) {
  const element = {
    id: item.id,
    type: item.type,
    label: item.label,
    props: {},
    line: item.line
  };

  for (const [key, value] of Object.entries(item.attrs)) {
    if (key === "action") {
      element.action = parseActionValue(value);
    } else {
      element.props[key] = value;
    }
  }

  return element;
}

function toAction(item) {
  return {
    id: item.id,
    label: item.label,
    type: item.attrs.type ?? "",
    target: item.attrs.target ?? "",
    line: item.line
  };
}

function parseActionValue(value) {
  const [type, ...targetParts] = value.split(":");
  return {
    type: type ?? "",
    target: targetParts.join(":")
  };
}
