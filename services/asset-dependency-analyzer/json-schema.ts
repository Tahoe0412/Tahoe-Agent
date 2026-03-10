export const assetDependencyAnalyzerJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "required_assets",
    "needs_character_base",
    "needs_scene_base",
    "needs_character_scene_composite",
    "needs_voice",
    "needs_reference_images",
    "missing_asset_hints",
    "is_asset_ready",
  ],
  properties: {
    required_assets: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["asset_code", "required", "reason", "reference_tags"],
        properties: {
          asset_code: {
            type: "string",
            enum: ["CHARACTER_BASE", "SCENE_BASE", "CHARACTER_SCENE_COMPOSITE", "VOICE", "REFERENCE_IMAGE"],
          },
          required: { type: "boolean" },
          reason: { type: "string", minLength: 1, maxLength: 200 },
          reference_tags: {
            type: "array",
            maxItems: 8,
            items: { type: "string", minLength: 1, maxLength: 64 },
          },
        },
      },
    },
    needs_character_base: { type: "boolean" },
    needs_scene_base: { type: "boolean" },
    needs_character_scene_composite: { type: "boolean" },
    needs_voice: { type: "boolean" },
    needs_reference_images: { type: "boolean" },
    missing_asset_hints: {
      type: "array",
      maxItems: 10,
      items: { type: "string", minLength: 1, maxLength: 120 },
    },
    is_asset_ready: { type: "boolean" },
  },
} as const;
