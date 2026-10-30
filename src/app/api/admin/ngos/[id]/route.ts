import { NextResponse } from "next/server";
import { z } from "zod";

import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const bodySchema = z.object({
  status: z.enum(["UNDER_REVIEW", "VERIFIED", "REJECTED"]),
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
  const ngo = await db.ngoProfile.update({
    where: { id: params.id },
    data: {
      verificationStatus: parsed.data.status,
      adminRemarks: parsed.data.remarks,
    },
  });
  if (parsed.data.status === "VERIFIED") {
    await db.document.updateMany({
      where: { ownerType: "NGO", ownerId: ngo.id },
      data: { status: "APPROVED" },
    });
  }
  await audit({
    actorId: session.user.id,
    action: `NGO_${parsed.data.status}`,
    entityType: "NgoProfile",
    entityId: ngo.id,
    meta: parsed.data.remarks,
  });
  return NextResponse.json(ngo);
}
