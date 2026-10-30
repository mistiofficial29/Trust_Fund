import { redirect } from "next/navigation";

import { CampaignWizard } from "@/components/forms/campaign-wizard";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function NewCampaignPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const ngo = await db.ngoProfile.findUnique({ where: { userId: session.user.id } });
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Create campaign</h1>
      <div className="mt-8">
        <CampaignWizard verified={ngo?.verificationStatus === "VERIFIED"} />
      </div>
    </div>
  );
}
