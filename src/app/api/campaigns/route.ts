import { NextResponse } from "next/server";

import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { sanitizeStory } from "@/lib/sanitize";
import { getSession } from "@/lib/session";
import { campaignSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "NGO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ngo = await db.ngoProfile.findUnique({ where: { userId: session.user.id } });
  if (!ngo) {
    return NextResponse.json({ error: "Complete NGO verification first." }, { status: 400 });
  }
  const parsed = campaignSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { budgetItems, submit, story, ...rest } = parsed.data;
  if (submit && ngo.verificationStatus !== "VERIFIED") {
    return NextResponse.json(
      { error: "Unverified organisations can save drafts, but cannot publish a campaign." },
      { status: 400 },
    );
  }
  const campaign = await db.campaign.create({
    data: {
      ...rest,
      story: sanitizeStory(story),
      ngoId: ngo.id,
      onchainId: `draft-${Date.now()}`,
      status: submit ? "PENDING_APPROVAL" : "DRAFT",
      startDate: new Date(rest.startDate),
      endDate: new Date(rest.endDate),
      budgetItems: { create: budgetItems },
    },
  });
  await db.campaign.update({
    where: { id: campaign.id },
    data: { onchainId: campaign.id },
  });
  await audit({
    actorId: session.user.id,
    action: submit ? "CAMPAIGN_SUBMIT" : "CAMPAIGN_DRAFT",
    entityType: "Campaign",
    entityId: campaign.id,
  });
  return NextResponse.json(campaign);
}
