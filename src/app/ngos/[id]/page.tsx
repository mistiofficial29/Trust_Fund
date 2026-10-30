import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CampaignCard } from "@/components/campaign/campaign-card";
import { CopyHash } from "@/components/campaign/copy-hash";
import { TrustBadges } from "@/components/ngo/trust-badges";
import { db } from "@/lib/db";
import { categoryLabel } from "@/lib/format";
import { ngoBadgeFlags } from "@/lib/ngo-badges";

export const metadata: Metadata = { title: "NGO" };

export default async function NgoPage({ params }: { params: { id: string } }) {
  const ngo = await db.ngoProfile.findUnique({
    where: { id: params.id },
    include: { campaigns: { where: { status: { in: ["ACTIVE", "COMPLETED"] } } } },
  });
  if (!ngo) notFound();
  const badges = await ngoBadgeFlags(ngo.id, ngo.verificationStatus, ngo.govtAffiliated);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm text-muted-foreground">Demo organisation</p>
      <h1 className="mt-1 text-3xl font-semibold">{ngo.legalName}</h1>
      <p className="mt-2 text-muted-foreground">
        {categoryLabel(ngo.registrationType)} · {ngo.city}, {ngo.state}
        {ngo.parentOrg ? ` · Branch of ${ngo.parentOrg}` : ""}
      </p>
      <div className="mt-4">
        <TrustBadges {...badges} />
      </div>
      <h2 className="mt-10 text-xl font-semibold">Documents</h2>
      <ul className="mt-4 space-y-3">
        {badges.docs.map((doc) => (
          <li key={doc.id} className="rounded-xl border p-3 text-sm">
            <p className="font-medium">{doc.type.replaceAll("_", " ")}</p>
            <p className="text-muted-foreground">{doc.status}</p>
            <CopyHash value={doc.sha256} />
          </li>
        ))}
      </ul>
      <h2 className="mt-10 text-xl font-semibold">Campaigns</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-3">
        {ngo.campaigns.map((c) => (
          <CampaignCard
            key={c.id}
            id={c.id}
            title={c.title}
            ngoName={ngo.legalName}
            verified={ngo.verificationStatus === "VERIFIED"}
            coverPath={c.coverPath}
            raisedInr={c.raisedInr}
            goalInr={c.goalInr}
            endDate={c.endDate}
          />
        ))}
      </div>
    </div>
  );
}
