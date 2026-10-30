import { NextResponse } from "next/server";
import { z } from "zod";

import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const bodySchema = z.object({
  status: z.enum(["ACTIVE", "REJECTED", "PAUSED"]),
  remarks: z.string().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const campaign = await db.campaign.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });
  await audit({
    actorId: session.user.id,
    action: `CAMPAIGN_${parsed.data.status}`,
    entityType: "Campaign",
    entityId: campaign.id,
    meta: parsed.data.remarks,
  });
  return NextResponse.json(campaign);
}
