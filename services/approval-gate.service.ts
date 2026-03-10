import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { approvalGateUpsertSchema } from "@/schemas/production-control";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class ApprovalGateService {
  async listByProject(projectId: string) {
    return prisma.approvalGate.findMany({
      where: { project_id: projectId },
      orderBy: [{ stage: "asc" }, { target_version: "desc" }, { created_at: "desc" }],
    });
  }

  async upsert(projectId: string, input: unknown) {
    const payload = approvalGateUpsertSchema.parse(input);

    return prisma.approvalGate.upsert({
      where: {
        project_id_stage_target_version: {
          project_id: projectId,
          stage: payload.stage,
          target_version: payload.target_version,
        },
      },
      create: {
        project_id: projectId,
        stage: payload.stage,
        approval_status: payload.approval_status,
        target_version: payload.target_version,
        reviewer_label: payload.reviewer_label,
        decision_summary: payload.decision_summary,
        decision_json: payload.decision_json ? toJson(payload.decision_json) : undefined,
        approved_at: payload.approval_status === "APPROVED" ? new Date() : null,
      },
      update: {
        approval_status: payload.approval_status,
        reviewer_label: payload.reviewer_label,
        decision_summary: payload.decision_summary,
        decision_json: payload.decision_json ? toJson(payload.decision_json) : Prisma.JsonNull,
        approved_at: payload.approval_status === "APPROVED" ? new Date() : null,
      },
    });
  }
}
