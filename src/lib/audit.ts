import { db } from "@/lib/db";

export function audit(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  meta?: string;
}) {
  return db.auditLog.create({ data: input });
}
