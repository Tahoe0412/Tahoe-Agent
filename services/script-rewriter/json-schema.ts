export const scriptRewriteJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["scenes"],
  properties: {
    scenes: {
      type: "array",
      minItems: 1,
      maxItems: 200,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "scene_order",
          "original_text",
          "rewritten_for_ai",
          "shot_goal",
          "duration_sec",
          "continuity_group",
          "visual_priority",
          "avoid",
        ],
        properties: {
          scene_order: { type: "integer", minimum: 1, maximum: 200 },
          original_text: { type: "string", minLength: 1, maxLength: 2000 },
          rewritten_for_ai: { type: "string", minLength: 1, maxLength: 2000 },
          shot_goal: { type: "string", minLength: 1, maxLength: 200 },
          duration_sec: { type: "integer", minimum: 1, maximum: 120 },
          continuity_group: { type: "string", minLength: 1, maxLength: 64 },
          visual_priority: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: { type: "string", minLength: 1, maxLength: 64 },
          },
          avoid: {
            type: "array",
            maxItems: 8,
            items: { type: "string", minLength: 1, maxLength: 64 },
          },
        },
      },
    },
  },
} as const;
