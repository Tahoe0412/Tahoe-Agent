export const promotionalCopyJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "master_angle",
    "headline_options",
    "hero_copy",
    "long_form_copy",
    "proof_points",
    "call_to_action",
    "risk_notes",
    "recommended_next_steps",
  ],
  properties: {
    master_angle: { type: "string" },
    headline_options: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 6,
    },
    hero_copy: { type: "string" },
    long_form_copy: { type: "string" },
    proof_points: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 8,
    },
    call_to_action: { type: "string" },
    risk_notes: {
      type: "array",
      items: { type: "string" },
      maxItems: 8,
    },
    platform_adaptations: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["platform_surface", "body_text"],
        properties: {
          platform_surface: {
            type: "string",
            enum: [
              "XIAOHONGSHU_POST",
              "XIAOHONGSHU_VIDEO",
              "DOUYIN_VIDEO",
              "DOUYIN_TITLE",
              "COMMENT_REPLY",
              "COVER_COPY",
            ],
          },
          title_text: { type: "string" },
          body_text: { type: "string" },
          hook_text: { type: "string" },
          cover_copy: { type: "string" },
          interaction_prompt: { type: "string" },
        },
      },
    },
    recommended_next_steps: {
      type: "array",
      items: { type: "string" },
      maxItems: 8,
    },
  },
} as const;
