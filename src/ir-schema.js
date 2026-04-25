export const IR_SCHEMA = {
  $schema: "https://spec-ui.dev/schemas/ir/v1",
  title: "Spec UI IR",
  type: "object",
  required: ["version", "title", "metadata", "screens"],
  additionalProperties: false,
  properties: {
    version: { type: "string" },
    title: { type: "string" },
    metadata: { $ref: "#/definitions/metadata" },
    screens: {
      type: "array",
      items: { $ref: "#/definitions/screen" }
    },
    flows: {
      type: "array",
      items: { $ref: "#/definitions/flow" }
    },
    contentRecords: {
      type: "array",
      items: { $ref: "#/definitions/contentRecord" }
    },
    layoutControls: {
      type: "array",
      items: { $ref: "#/definitions/layoutDeclaration" }
    },
    tokens: {
      type: "array",
      items: { $ref: "#/definitions/tokenGroup" }
    },
    acceptance: { $ref: "#/definitions/acceptance" }
  },
  definitions: {
    metadata: {
      type: "object",
      required: [
        "generatedBy",
        "sourceMode",
        "sourceHash",
        "compiledAt",
        "surface",
        "renderingTarget",
        "adapter",
        "resolvedLibrary",
        "assetProvenance"
      ],
      additionalProperties: false,
      properties: {
        generatedBy: { const: "spec-ui" },
        sourceMode: { enum: ["single-file", "package"] },
        sourceHash: {
          type: "string",
          pattern: "^[a-f0-9]{64}$"
        },
        compiledAt: {
          anyOf: [{ type: "string" }, { type: "null" }]
        },
        surface: { type: "string" },
        package: { $ref: "#/definitions/packageMetadata" },
        renderingTarget: { $ref: "#/definitions/renderingTarget" },
        adapter: { $ref: "#/definitions/adapter" },
        resolvedLibrary: { $ref: "#/definitions/resolvedLibrary" },
        assetProvenance: { $ref: "#/definitions/assetProvenance" },
        acceptanceSummary: { $ref: "#/definitions/acceptanceSummary" }
      }
    },
    packageMetadata: {
      type: "object",
      required: ["title", "manifestPath", "fidelity", "target", "includedFiles"],
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        manifestPath: { type: "string" },
        fidelity: { type: "string" },
        target: { type: "string" },
        includedFiles: {
          type: "array",
          items: { $ref: "#/definitions/includedFile" }
        }
      }
    },
    includedFile: {
      type: "object",
      required: ["path", "role", "required", "exists", "order", "sourceHash", "sourceFile", "manifestLine"],
      additionalProperties: false,
      properties: {
        path: { type: "string" },
        role: { type: "string" },
        required: { type: "boolean" },
        exists: { type: "boolean" },
        order: { type: "number" },
        sourceHash: {
          anyOf: [
            { type: "string", pattern: "^[a-f0-9]{64}$" },
            { type: "null" }
          ]
        },
        sourceFile: { type: "string" },
        manifestLine: { type: "number" }
      }
    },
    renderingTarget: {
      type: "object",
      required: ["target", "version", "resolvedTarget", "selectionSource"],
      additionalProperties: false,
      properties: {
        target: { type: "string" },
        version: { type: "string" },
        resolvedTarget: { type: "string" },
        selectionSource: { type: "string" }
      }
    },
    adapter: {
      type: "object",
      required: ["target", "version", "resolvedTarget"],
      additionalProperties: false,
      properties: {
        target: { type: "string" },
        version: { type: "string" },
        resolvedTarget: { type: "string" }
      }
    },
    resolvedLibrary: {
      type: "object",
      required: ["name", "version"],
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        version: { type: "string" }
      }
    },
    assetProvenance: {
      type: "object",
      required: ["mode", "source"],
      additionalProperties: false,
      properties: {
        mode: { type: "string" },
        source: { type: "string" }
      }
    },
    acceptanceSummary: {
      type: "object",
      required: ["invariantCount", "noteCount", "invariants"],
      additionalProperties: false,
      properties: {
        invariantCount: { type: "number" },
        noteCount: { type: "number" },
        invariants: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "target", "source"],
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              target: { type: "string" },
              source: { $ref: "#/definitions/sourceRef" }
            }
          }
        }
      }
    },
    sourceRef: {
      type: "object",
      required: ["file", "role", "line"],
      additionalProperties: false,
      properties: {
        file: { type: "string" },
        role: { type: "string" },
        line: { type: "number" }
      }
    },
    layout: {
      type: "object",
      additionalProperties: {
        anyOf: [
          { type: "string" },
          {
            type: "object",
            additionalProperties: { type: "string" }
          }
        ]
      }
    },
    screen: {
      type: "object",
      required: ["id", "title", "shell", "kind", "regions", "sections", "states"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        shell: { type: "string" },
        kind: { type: "string" },
        gap: {
          anyOf: [{ type: "string" }, { type: "null" }]
        },
        layout: { $ref: "#/definitions/layout" },
        source: { $ref: "#/definitions/sourceRef" },
        regions: {
          type: "array",
          items: { $ref: "#/definitions/region" }
        },
        sections: {
          type: "array",
          items: { $ref: "#/definitions/section" }
        },
        states: {
          type: "array",
          items: { $ref: "#/definitions/state" }
        }
      }
    },
    region: {
      type: "object",
      required: ["id", "title", "type", "blocks"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        type: { type: "string" },
        gap: {
          anyOf: [{ type: "string" }, { type: "null" }]
        },
        layout: { $ref: "#/definitions/layout" },
        source: { $ref: "#/definitions/sourceRef" },
        blocks: {
          type: "array",
          items: { $ref: "#/definitions/block" }
        }
      }
    },
    block: {
      type: "object",
      required: ["id", "title", "type", "variant", "items", "actions"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        type: { type: "string" },
        variant: {
          anyOf: [{ type: "string" }, { type: "null" }]
        },
        gap: {
          anyOf: [{ type: "string" }, { type: "null" }]
        },
        layout: { $ref: "#/definitions/layout" },
        source: { $ref: "#/definitions/sourceRef" },
        items: {
          type: "array",
          items: { $ref: "#/definitions/element" }
        },
        actions: {
          type: "array",
          items: { $ref: "#/definitions/action" }
        },
        states: {
          type: "array",
          items: { $ref: "#/definitions/state" }
        }
      }
    },
    section: {
      type: "object",
      required: ["id", "title", "elements", "actions"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        source: { $ref: "#/definitions/sourceRef" },
        elements: {
          type: "array",
          items: { $ref: "#/definitions/element" }
        },
        actions: {
          type: "array",
          items: { $ref: "#/definitions/action" }
        }
      }
    },
    element: {
      type: "object",
      required: ["id", "type", "label", "props"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        type: { type: "string" },
        label: { type: "string" },
        props: {
          type: "object",
          additionalProperties: { type: "string" }
        },
        source: { $ref: "#/definitions/sourceRef" },
        action: {
          anyOf: [
            { type: "string" },
            { $ref: "#/definitions/action" }
          ]
        }
      }
    },
    action: {
      type: "object",
      required: ["id", "label", "type", "target"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        label: { type: "string" },
        type: { type: "string" },
        target: { type: "string" },
        source: { $ref: "#/definitions/sourceRef" }
      }
    },
    state: {
      type: "object",
      required: ["id", "type", "label", "items"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        type: { type: "string" },
        label: { type: "string" },
        source: { $ref: "#/definitions/sourceRef" },
        items: {
          type: "array",
          items: { $ref: "#/definitions/element" }
        }
      }
    },
    transition: {
      type: "object",
      required: ["from", "action", "to"],
      additionalProperties: false,
      properties: {
        from: { type: "string" },
        action: { type: "string" },
        to: { type: "string" }
      }
    },
    flow: {
      type: "object",
      required: ["id", "title", "start", "source", "steps"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        start: { type: "string" },
        source: { $ref: "#/definitions/sourceRef" },
        steps: {
          type: "array",
          items: {
            type: "object",
            required: ["label", "from", "action", "to", "source"],
            additionalProperties: false,
            properties: {
              label: { type: "string" },
              from: { type: "string" },
              action: { type: "string" },
              to: { type: "string" },
              source: { $ref: "#/definitions/sourceRef" }
            }
          }
        }
      }
    },
    contentRecord: {
      type: "object",
      required: ["id", "title", "type", "source", "items"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        type: { type: "string" },
        source: { $ref: "#/definitions/sourceRef" },
        items: {
          type: "array",
          items: { $ref: "#/definitions/element" }
        }
      }
    },
    layoutDeclaration: {
      type: "object",
      required: ["title", "target", "source", "controls"],
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        target: { type: "string" },
        source: { $ref: "#/definitions/sourceRef" },
        controls: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "value", "attrs", "source"],
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              value: { type: "string" },
              attrs: {
                type: "object",
                additionalProperties: { type: "string" }
              },
              source: { $ref: "#/definitions/sourceRef" }
            }
          }
        }
      }
    },
    tokenGroup: {
      type: "object",
      required: ["id", "title", "source", "controls"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        source: { $ref: "#/definitions/sourceRef" },
        controls: {
          type: "array",
          items: {
            type: "object",
            required: ["type", "target", "value", "source"],
            additionalProperties: false,
            properties: {
              type: { type: "string" },
              target: { type: "string" },
              value: { type: "string" },
              source: { $ref: "#/definitions/sourceRef" }
            }
          }
        }
      }
    },
    acceptance: {
      type: "object",
      required: ["invariants", "notes"],
      additionalProperties: false,
      properties: {
        invariants: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "target", "source"],
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              target: { type: "string" },
              source: { $ref: "#/definitions/sourceRef" }
            }
          }
        },
        notes: {
          type: "array",
          items: {
            type: "object",
            required: ["text", "source"],
            additionalProperties: false,
            properties: {
              text: { type: "string" },
              source: { $ref: "#/definitions/sourceRef" }
            }
          }
        }
      }
    }
  }
};
