export const platformAdaptationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["body_text", "adaptation_notes"],
  properties: {
    title_text: { type: "string", maxLength: 240 },
    body_text: { type: "string", minLength: 6, maxLength: 8000 },
    hook_text: { type: "string", maxLength: 400 },
    cover_copy: { type: "string", maxLength: 240 },
    interaction_prompt: { type: "string", maxLength: 1000 },
    adaptation_notes: {
      type: "array",
      maxItems: 12,
      items: { type: "string", minLength: 1, maxLength: 200 },
    },
  },
} as const;
