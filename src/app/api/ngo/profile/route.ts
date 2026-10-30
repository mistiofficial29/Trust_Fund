import { NextResponse } from "next/server";

import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ngoProfileSchema } from "@/lib/validators";

export async function GET() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "NGO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const profile = await db.ngoProfile.findUnique({ where: { userId: session.user.id } });
  const docs = profile
    ? await db.document.findMany({ where: { ownerType: "NGO", ownerId: profile.id } })
    : [];
  return NextResponse.json({ profile, docs });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "NGO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = ngoProfileSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const existing = await db.ngoProfile.findUnique({ where: { userId: session.user.id } });
  const profile = existing
    ? await db.ngoProfile.update({
        where: { id: existing.id },
        data: {
          ...data,
          website: data.website || null,
          verificationStatus: existing.verificationStatus === "VERIFIED" ? "VERIFIED" : "PENDING",
        },
      })
    : await db.ngoProfile.create({
        data: {
          ...data,
          website: data.website || null,
          userId: session.user.id,
        },
      });
  await audit({
    actorId: session.user.id,
    action: existing ? "NGO_PROFILE_UPDATE" : "NGO_PROFILE_CREATE",
    entityType: "NgoProfile",
    entityId: profile.id,
  });
  return NextResponse.json(profile);
}
