import { notFound } from "next/navigation";

import { DonateForm } from "@/components/donate/donate-form";
import { db } from "@/lib/db";

export default async function DonatePage({ params }: { params: { campaignId: string } }) {
  const campaign = await db.campaign.findUnique({ where: { id: params.campaignId } });
  if (!campaign || campaign.status !== "ACTIVE") notFound();
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <DonateForm campaignId={campaign.id} onchainId={campaign.onchainId} title={campaign.title} />
    </div>
  );
}
