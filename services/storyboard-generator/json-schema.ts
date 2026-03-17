/**
 * JSON Schema for LLM-generated storyboard frames.
 *
 * The LLM receives ScriptScene data and produces an array of storyboard frames,
 * each containing a visual prompt, camera plan, and other production metadata.
 */
export const storyboardGenerateJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["frames"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 160 },
    goal_summary: { type: "string", maxLength: 2000 },
    style_direction: { type: "string", maxLength: 1000 },
    frames: {
      type: "array",
      minItems: 1,
      maxItems: 120,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "frame_order",
          "frame_title",
          "visual_prompt",
          "narration_text",
          "duration_sec",
        ],
        properties: {
          frame_order: { type: "integer", minimum: 1, maximum: 120 },
          frame_title: { type: "string", minLength: 2, maxLength: 160 },
          visual_prompt: { type: "string", minLength: 10, maxLength: 6000 },
          negative_prompt: { type: "string", maxLength: 3000 },
          narration_text: { type: "string", maxLength: 2000 },
          on_screen_text: { type: "string", maxLength: 1000 },
          composition_notes: { type: "string", maxLength: 2000 },
          camera_plan: { type: "string", maxLength: 500 },
          motion_plan: { type: "string", maxLength: 500 },
          continuity_group: { type: "string", maxLength: 120 },
          duration_sec: { type: "integer", minimum: 1, maximum: 120 },
          production_class: {
            type: "string",
            enum: ["A", "B", "C", "D", "E", "F", "G", "T"],
          },
        },
      },
    },
  },
} as const;
