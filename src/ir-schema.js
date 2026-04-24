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
      required: ["generatedBy", "sourceHash", "compiledAt"],
      additionalProperties: false,
      properties: {
        generatedBy: { const: "spec-ui" },
        sourceHash: {
          type: "string",
          pattern: "^[a-f0-9]{64}$"
        },
        compiledAt: {
          anyOf: [{ type: "string" }, { type: "null" }]
        }
      }
    },
    screen: {
      type: "object",
      required: ["id", "title", "sections", "states"],
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        title: { type: "string" },
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
