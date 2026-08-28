import "server-only";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "import"
  | "settings";
export type AuditEntity =
  | "category"
  | "product"
  | "brand"
  | "wordmark"
  | "backup"
  | "trash"
  | "password"
  | "business"
  | "venue";

// Append one audit row. Best-effort: logging must never fail the mutation it
// records (SECURITY.md §4b). Callers are already behind requireAdmin().
export async function audit(
  action: AuditAction,
  entity: AuditEntity,
  detail?: string,
) {
  try {
    await prisma.auditLog.create({
      data: { action, entity, detail: detail?.slice(0, 200) ?? null },
    });
  } catch {
    // swallow — the audit trail is a convenience, not a gate
  }
}

export type AuditRow = {
  id: string;
  action: string;
  entity: string;
  detail: string | null;
  createdAt: string;
};

/** Most-recent audit entries for the Settings "recent activity" list. */
export async function getRecentAudit(
  limit = config.audit.pageSize,
): Promise<AuditRow[]> {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, action: true, entity: true, detail: true, createdAt: true },
  });
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}
