import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sanitizeStory } from "@/lib/sanitize";
import { getSession } from "@/lib/session";
import { campaignSchema } from "@/lib/validators";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "NGO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ngo = await db.ngoProfile.findUnique({ where: { userId: session.user.id } });
  const campaign = await db.campaign.findUnique({ where: { id: params.id } });
  if (!ngo || !campaign || campaign.ngoId !== ngo.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!["DRAFT", "REJECTED"].includes(campaign.status)) {
    return NextResponse.json({ error: "This campaign can no longer be edited." }, { status: 400 });
  }
  const parsed = campaignSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { budgetItems, submit, story, ...rest } = parsed.data;
  if (submit && ngo.verificationStatus !== "VERIFIED") {
    return NextResponse.json({ error: "Unverified organisations cannot publish." }, { status: 400 });
  }
  await db.budgetItem.deleteMany({ where: { campaignId: campaign.id } });
  const updated = await db.campaign.update({
    where: { id: campaign.id },
    data: {
      ...rest,
      story: sanitizeStory(story),
      startDate: new Date(rest.startDate),
      endDate: new Date(rest.endDate),
      status: submit ? "PENDING_APPROVAL" : "DRAFT",
      budgetItems: { create: budgetItems },
    },
  });
  return NextResponse.json(updated);
}
