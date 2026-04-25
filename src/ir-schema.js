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
    }
  },
  definitions: {
    metadata: {
      type: "object",
      required: [
        "generatedBy",
        "sourceHash",
        "compiledAt",
        "surface",
        "renderingTarget"
      ],
      additionalProperties: false,
      properties: {
        generatedBy: { const: "spec-ui" },
        sourceHash: {
          type: "string",
          pattern: "^[a-f0-9]{64}$"
        },
        compiledAt: {
          anyOf: [{ type: "string" }, { type: "null" }]
        },
        surface: { type: "string" },
        renderingTarget: { $ref: "#/definitions/renderingTarget" }
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
        target: { type: "string" }
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
    }
  }
};
