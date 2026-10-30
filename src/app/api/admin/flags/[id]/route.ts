import { NextResponse } from "next/server";

import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { flagReviewSchema } from "@/lib/validators";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = flagReviewSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const flag = await db.fraudFlag.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      notes: parsed.data.notes,
      reviewedById: session.user.id,
    },
  });
  await audit({
    actorId: session.user.id,
    action: `FLAG_${parsed.data.status}`,
    entityType: "FraudFlag",
    entityId: flag.id,
    meta: parsed.data.notes,
  });
  return NextResponse.json(flag);
}
