import Link from "next/link";
import { redirect } from "next/navigation";

import { ReviewActions } from "@/components/admin/review-actions";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function AdminCampaigns() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const campaigns = await db.campaign.findMany({
    where: { status: { in: ["PENDING_APPROVAL", "ACTIVE", "PAUSED"] } },
    include: { ngo: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Campaign approval queue</h1>
      <ul className="mt-8 space-y-4">
        {campaigns.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
            <div>
              <Link className="font-medium hover:underline" href={`/campaigns/${c.id}`}>
                {c.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {c.ngo.legalName} · {c.status} · {formatInr(c.goalInr)}
              </p>
            </div>
            <ReviewActions url={`/api/admin/campaigns/${c.id}`} approveValue="ACTIVE" rejectValue="REJECTED" />
          </li>
        ))}
      </ul>
    </div>
  );
}
