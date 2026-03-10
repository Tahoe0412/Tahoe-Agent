export const sceneClassificationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "human_type",
    "motion_type",
    "lip_sync_type",
    "asset_dependency_type",
    "production_class",
    "difficulty_score",
    "risk_flags",
  ],
  properties: {
    human_type: { type: "string", enum: ["H0", "H1"] },
    motion_type: { type: "string", enum: ["M0", "M1", "M2"] },
    lip_sync_type: { type: "string", enum: ["L0", "L1"] },
    asset_dependency_type: { type: "string", enum: ["S0", "S1", "S2", "S3", "S4"] },
    production_class: { type: "string", enum: ["A", "B", "C", "D", "E", "F", "G", "T"] },
    difficulty_score: { type: "integer", minimum: 1, maximum: 100 },
    risk_flags: {
      type: "array",
      maxItems: 10,
      items: { type: "string", minLength: 1, maxLength: 64 },
    },
  },
} as const;
