import {
  IMPLEMENTATION_DETAIL_PATTERN,
  RESERVED_HTML_PATTERN
} from "./contracts.js";

const SPEC_RE = /^# Spec:\s*(.+?)\s*$/;
const PROTOTYPE_RE = /^# Prototype:\s*(.+?)\s*$/;
const SCREEN_RE = /^## Screen:\s*(.+?)\s*$/;
const SECTION_RE = /^### Section:\s*(.+?)\s*$/;
const REGION_RE = /^### Region:\s*(.+?)\s*$/;
const BLOCK_RE = /^#### Block:\s*(.+?)\s*$/;
const STATE_RE = /^#### State:\s*(.+?)\s*$/;
const BLOCK_STATE_RE = /^##### State:\s*(.+?)\s*$/;
const ITEM_RE = /^-\s*([A-Za-z][A-Za-z0-9-]*)#([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.+?)\s*$/;
const INCLUDE_RE = /^-\s*(.+?)\s*$/;
const FLOW_RE = /^## Flow:\s*(.+?)\s*$/;
const FLOW_STEP_RE = /^-\s*Step:\s*(.+?)\s*$/;
const CONTENT_RE = /^## Content:\s*(.+?)\s*$/;
const CONTENT_ITEM_RE = /^-\s*([A-Za-z][A-Za-z0-9-]*):\s*(.+?)\s*$/;
const LAYOUT_RE = /^## Layout:\s*(.+?)\s*$/;
const LAYOUT_CONTROL_RE = /^-\s*Control:\s*([A-Za-z][A-Za-z0-9-]*)\s*(?:\[(.*?)\])?\s*$/;
const TOKENS_RE = /^## Tokens:\s*(.+?)\s*$/;
const TOKEN_RE = /^-\s*(Tone|Radius|Density|Treatment):\s*(.+?)\s*$/;
const ACCEPTANCE_RE = /^## Acceptance\s*$/;
const ACCEPTANCE_ITEM_RE = /^-\s*(Invariant|Note):\s*(.+?)\s*$/;

export function parseSpec(markdown, options = {}) {
  const source = {
    title: options.title ?? "",
    attrs: options.attrs ?? {},
    line: undefined,
    screens: [],
    errors: []
  };

  if (options.sourceMode) source.sourceMode = options.sourceMode;
  if (options.sourceFile) source.sourceFile = options.sourceFile;
  if (options.sourceRole) source.sourceRole = options.sourceRole;
  if (options.surface) source.surface = options.surface;
  if (options.adapter) source.adapter = options.adapter;

  const lines = String(markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
  const firstContent = lines.findIndex((line) => line.trim() !== "");
  const requireSpecTitle = options.requireSpecTitle !== false;

  if (firstContent >= 0 && requireSpecTitle) {
    const firstLine = lines[firstContent].trim();
    const spec = parseHeading(firstLine, SPEC_RE);
    if (spec) {
      source.title = spec.title;
      source.attrs = spec.attrs;
      source.surface = spec.attrs.surface;
      source.adapter = spec.attrs.adapter;
      source.line = firstContent + 1;
    } else {
      source.errors.push({
        code: "missing_spec_title",
        message: 'First non-empty line must be "# Spec: <title>".',
        line: firstContent + 1
      });
    }
  } else if (firstContent >= 0) {
    source.line = firstContent + 1;
  }

  let currentScreen = null;
  let currentSection = null;
  let currentRegion = null;
  let currentBlock = null;
  let currentState = null;
  let currentBlockState = null;

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

    if (IMPLEMENTATION_DETAIL_PATTERN.test(line)) {
      source.errors.push({
        code: "implementation_detail",
        message: "Raw CSS, JSX, scripts, styles, or component markup are not supported in Spec UI markdown.",
        line: lineNumber
      });
      return;
    }

    const screen = parseHeading(line, SCREEN_RE);
    if (screen) {
      currentScreen = {
        id: screen.attrs.id ?? "",
        title: screen.title,
        shell: screen.attrs.shell,
        kind: screen.attrs.kind,
        attrs: screen.attrs,
        ...sourceLocation(lineNumber, options),
        regions: [],
        sections: [],
        states: []
      };
      source.screens.push(currentScreen);
      currentSection = null;
      currentRegion = null;
      currentBlock = null;
      currentState = null;
      currentBlockState = null;
      return;
    }

    const region = parseHeading(line, REGION_RE);
    if (region) {
      if (!currentScreen) {
        source.errors.push({
          code: "region_outside_screen",
          message: "Region must be declared inside a screen.",
          line: lineNumber
        });
        currentSection = null;
        currentRegion = null;
        currentBlock = null;
        currentState = null;
        currentBlockState = null;
        return;
      }

      currentRegion = {
        id: region.attrs.id ?? "",
        type: region.attrs.type ?? "",
        title: region.title,
        attrs: region.attrs,
        ...sourceLocation(lineNumber, options),
        blocks: []
      };
      currentScreen.regions.push(currentRegion);
      currentSection = null;
      currentBlock = null;
      currentState = null;
      currentBlockState = null;
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
        currentRegion = null;
        currentBlock = null;
        currentState = null;
        currentBlockState = null;
        return;
      }

      currentSection = {
        id: section.attrs.id ?? "",
        title: section.title,
        attrs: section.attrs,
        ...sourceLocation(lineNumber, options),
        elements: [],
        actions: [],
        blocks: []
      };
      currentScreen.sections.push(currentSection);
      currentRegion = null;
      currentBlock = null;
      currentState = null;
      currentBlockState = null;
      return;
    }

    const block = parseHeading(line, BLOCK_RE);
    if (block) {
      if (!currentRegion && !currentSection) {
        source.errors.push({
          code: "block_outside_region_or_section",
          message: "Block must be declared inside a region or legacy section.",
          line: lineNumber
        });
        currentBlock = null;
        currentState = null;
        currentBlockState = null;
        return;
      }

      currentBlock = {
        id: block.attrs.id ?? "",
        type: block.attrs.type ?? "",
        variant: block.attrs.variant,
        title: block.title,
        attrs: block.attrs,
        ...sourceLocation(lineNumber, options),
        items: [],
        actions: [],
        states: []
      };

      if (currentRegion) {
        currentRegion.blocks.push(currentBlock);
      } else {
        currentSection.blocks.push(currentBlock);
      }

      currentState = null;
      currentBlockState = null;
      return;
    }

    const blockState = parseHeading(line, BLOCK_STATE_RE);
    if (blockState) {
      if (!currentBlock) {
        source.errors.push({
          code: "state_outside_block",
          message: "Nested block state must be declared inside a block.",
          line: lineNumber
        });
        currentBlockState = null;
        return;
      }

      currentBlockState = {
        id: blockState.attrs.id ?? "",
        type: blockState.attrs.type ?? "default",
        label: blockState.title,
        attrs: blockState.attrs,
        ...sourceLocation(lineNumber, options),
        items: [],
        actions: []
      };
      currentBlock.states.push(currentBlockState);
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
        currentRegion = null;
        currentBlock = null;
        currentState = null;
        currentBlockState = null;
        return;
      }

      currentState = {
        id: state.attrs.id ?? "",
        type: state.attrs.type ?? "default",
        label: state.title,
        attrs: state.attrs,
        ...sourceLocation(lineNumber, options),
        items: []
      };
      currentScreen.states.push(currentState);
      currentSection = null;
      currentRegion = null;
      currentBlock = null;
      currentBlockState = null;
      return;
    }

    const item = parseItem(line, lineNumber, options);
    if (item) {
      if (currentBlockState) {
        appendSemanticItem(currentBlockState, item);
        return;
      }

      if (currentBlock) {
        appendSemanticItem(currentBlock, item);
        return;
      }

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
        message: "Element must be declared inside a block, section, or state.",
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

export function parsePrototypeManifest(markdown, options = {}) {
  const manifestPath = options.manifestPath ?? "prototype.md";
  const sourceFile = options.sourceFile ?? manifestPath;
  const lines = String(markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
  const firstContent = lines.findIndex((line) => line.trim() !== "");
  const manifest = {
    title: "",
    attrs: {},
    surface: undefined,
    adapter: "bootstrap-html",
    target: "standalone-html",
    fidelity: "prototype",
    line: undefined,
    sourceFile,
    includes: [],
    sourceHashInputs: [manifestPath],
    errors: []
  };

  if (firstContent < 0) {
    manifest.errors.push({
      code: "missing_package_manifest",
      message: 'Package manifest must start with "# Prototype: <title>".',
      line: 1,
      sourceFile
    });
    return manifest;
  }

  const prototype = parseHeading(lines[firstContent].trim(), PROTOTYPE_RE);
  if (!prototype) {
    manifest.errors.push({
      code: "missing_package_manifest",
      message: 'Package manifest must start with "# Prototype: <title>".',
      line: firstContent + 1,
      sourceFile
    });
  } else {
    manifest.title = prototype.title;
    manifest.attrs = prototype.attrs;
    manifest.surface = prototype.attrs.surface;
    manifest.adapter = prototype.attrs.adapter ?? manifest.adapter;
    manifest.target = prototype.attrs.target ?? manifest.target;
    manifest.fidelity = prototype.attrs.fidelity ?? manifest.fidelity;
    manifest.line = firstContent + 1;
  }

  let inIncludes = false;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (line === "" || line.match(PROTOTYPE_RE)) return;

    if (line === "Includes:" || line === "## Includes") {
      inIncludes = true;
      return;
    }

    if (inIncludes && line.startsWith("#")) {
      inIncludes = false;
      return;
    }

    if (!inIncludes) return;

    const include = line.match(INCLUDE_RE);
    if (!include) return;

    const { text, attrs } = extractAttrs(include[1]);
    const includePath = text.trim();
    const record = {
      path: includePath,
      role: attrs.role ?? inferRoleFromPath(includePath),
      required: attrs.required !== "false",
      attrs,
      line: lineNumber,
      sourceFile
    };
    manifest.includes.push(record);
    manifest.sourceHashInputs.push(includePath);
  });

  return manifest;
}

export function parsePackageRoleFile(markdown, options = {}) {
  if (options.role === "screens") {
    return parseSpec(markdown, {
      title: options.title,
      attrs: options.attrs,
      surface: options.surface,
      adapter: options.adapter,
      requireSpecTitle: false,
      sourceMode: "package",
      sourceFile: options.sourceFile,
      sourceRole: "screens"
    });
  }

  const role = options.role;
  const parsed = {
    role,
    sourceFile: options.sourceFile,
    errors: []
  };

  const lines = String(markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
  let current = null;

  for (const [index, rawLine] of lines.entries()) {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (line === "") continue;

    if (RESERVED_HTML_PATTERN.test(line)) {
      parsed.errors.push(rawHtmlError(lineNumber, options));
      continue;
    }

    if (IMPLEMENTATION_DETAIL_PATTERN.test(line)) {
      parsed.errors.push(implementationDetailError(lineNumber, options));
      continue;
    }

    if (role === "flows") {
      current = parseFlowLine(parsed, current, line, lineNumber, options);
      continue;
    }

    if (role === "content") {
      current = parseContentLine(parsed, current, line, lineNumber, options);
      continue;
    }

    if (role === "layout") {
      current = parseLayoutLine(parsed, current, line, lineNumber, options);
      continue;
    }

    if (role === "tokens") {
      current = parseTokenLine(parsed, current, line, lineNumber, options);
      continue;
    }

    if (role === "acceptance") {
      current = parseAcceptanceLine(parsed, current, line, lineNumber, options);
      continue;
    }

    parsed.errors.push(unrecognizedPackageLine(lineNumber, options));
  }

  return parsed;
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

function parseItem(line, lineNumber, options = {}) {
  const match = line.match(ITEM_RE);
  if (!match) return null;

  const { text, attrs } = extractAttrs(match[3], lineNumber);
  return {
    type: match[1],
    id: match[2],
    label: text,
    attrs,
    ...sourceLocation(lineNumber, options)
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

export function parseAttrs(block) {
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
    ...copySourceLocation(item)
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
    ...copySourceLocation(item)
  };
}

function toSemanticItem(item) {
  const element = toElement(item);
  element.attrs = item.attrs;
  return element;
}

function appendSemanticItem(parent, item) {
  if (item.type === "action") {
    parent.actions.push(toAction(item));
    return;
  }

  parent.items.push(toSemanticItem(item));
}

function parseActionValue(value) {
  const [type, ...targetParts] = value.split(":");
  return {
    type: type ?? "",
    target: targetParts.join(":")
  };
}

function parseFlowLine(parsed, current, line, lineNumber, options) {
  const flow = parseHeading(line, FLOW_RE);
  if (flow) {
    const record = {
      id: flow.attrs.id ?? "",
      title: flow.title,
      start: flow.attrs.start ?? "",
      attrs: flow.attrs,
      ...sourceLocation(lineNumber, options),
      steps: []
    };
    parsed.flows ??= [];
    parsed.flows.push(record);
    return record;
  }

  const step = parseHeading(line, FLOW_STEP_RE);
  if (step && current) {
    current.steps.push({
      label: step.title,
      from: step.attrs.from ?? "",
      action: step.attrs.action ?? "",
      to: step.attrs.to ?? "",
      attrs: step.attrs,
      ...sourceLocation(lineNumber, options)
    });
    return current;
  }

  parsed.errors.push(unrecognizedPackageLine(lineNumber, options));
  return current;
}

function parseContentLine(parsed, current, line, lineNumber, options) {
  const content = parseHeading(line, CONTENT_RE);
  if (content) {
    const record = {
      id: content.attrs.id ?? "",
      type: content.attrs.type ?? "",
      title: content.title,
      attrs: content.attrs,
      ...sourceLocation(lineNumber, options),
      records: []
    };
    parsed.contentRecords ??= [];
    parsed.contentRecords.push(record);
    return record;
  }

  const item = line.match(CONTENT_ITEM_RE);
  if (item && current) {
    const { text, attrs } = extractAttrs(item[2]);
    current.records.push({
      kind: item[1],
      label: text,
      attrs,
      ...sourceLocation(lineNumber, options)
    });
    return current;
  }

  parsed.errors.push(unrecognizedPackageLine(lineNumber, options));
  return current;
}

function parseLayoutLine(parsed, current, line, lineNumber, options) {
  const layout = parseHeading(line, LAYOUT_RE);
  if (layout) {
    const record = {
      title: layout.title,
      target: layout.attrs.target ?? "",
      attrs: layout.attrs,
      ...sourceLocation(lineNumber, options),
      controls: []
    };
    parsed.layout ??= [];
    parsed.layout.push(record);
    return record;
  }

  const control = line.match(LAYOUT_CONTROL_RE);
  if (control && current) {
    current.controls.push({
      name: control[1],
      attrs: control[2] ? parseAttrs(`[${control[2]}]`) : {},
      ...sourceLocation(lineNumber, options)
    });
    return current;
  }

  parsed.errors.push(unrecognizedPackageLine(lineNumber, options));
  return current;
}

function parseTokenLine(parsed, current, line, lineNumber, options) {
  const tokens = parseHeading(line, TOKENS_RE);
  if (tokens) {
    const record = {
      id: tokens.attrs.id ?? "",
      title: tokens.title,
      attrs: tokens.attrs,
      ...sourceLocation(lineNumber, options),
      controls: []
    };
    parsed.tokens ??= [];
    parsed.tokens.push(record);
    return record;
  }

  const token = line.match(TOKEN_RE);
  if (token && current) {
    const { text, attrs } = extractAttrs(token[2]);
    current.controls.push({
      name: token[1].toLowerCase(),
      target: attrs.target ?? text,
      attrs,
      ...sourceLocation(lineNumber, options)
    });
    return current;
  }

  parsed.errors.push(unrecognizedPackageLine(lineNumber, options));
  return current;
}

function parseAcceptanceLine(parsed, current, line, lineNumber, options) {
  if (line.match(ACCEPTANCE_RE)) {
    parsed.acceptance = {
      ...sourceLocation(lineNumber, options),
      invariants: [],
      notes: []
    };
    return parsed.acceptance;
  }

  const item = line.match(ACCEPTANCE_ITEM_RE);
  if (item && current) {
    const { text, attrs } = extractAttrs(item[2]);
    const record = {
      name: text,
      target: attrs.target ?? "",
      attrs,
      ...sourceLocation(lineNumber, options)
    };

    if (item[1] === "Invariant") {
      current.invariants.push(record);
    } else {
      current.notes.push(record);
    }
    return current;
  }

  parsed.errors.push(unrecognizedPackageLine(lineNumber, options));
  return current;
}

function sourceLocation(lineNumber, options = {}) {
  const location = { line: lineNumber };

  if (options.sourceFile) location.sourceFile = options.sourceFile;
  if (options.sourceRole) location.sourceRole = options.sourceRole;
  if (options.sourceFile || options.sourceRole) location.sourceLine = lineNumber;

  return location;
}

function copySourceLocation(node) {
  const location = { line: node.line };

  if (node.sourceFile) location.sourceFile = node.sourceFile;
  if (node.sourceRole) location.sourceRole = node.sourceRole;
  if (node.sourceLine) location.sourceLine = node.sourceLine;

  return location;
}

function inferRoleFromPath(includePath) {
  return includePath.replace(/^.*\//, "").replace(/\.md$/i, "");
}

function rawHtmlError(lineNumber, options) {
  return {
    code: "raw_html",
    message: "Raw HTML is not supported in Spec UI markdown.",
    ...sourceLocation(lineNumber, options)
  };
}

function implementationDetailError(lineNumber, options) {
  return {
    code: "implementation_detail",
    message: "Raw CSS, JSX, scripts, styles, or component markup are not supported in Spec UI markdown.",
    ...sourceLocation(lineNumber, options)
  };
}

function unrecognizedPackageLine(lineNumber, options) {
  return {
    code: "unrecognized_package_structure",
    message: "Line does not match supported prototype package markdown structure.",
    ...sourceLocation(lineNumber, options)
  };
}
