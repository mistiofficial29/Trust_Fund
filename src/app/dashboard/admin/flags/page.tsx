import { redirect } from "next/navigation";

import { ReviewActions } from "@/components/admin/review-actions";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function AdminFlags() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const flags = await db.fraudFlag.findMany({
    include: { expense: { include: { campaign: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Flags queue</h1>
      <ul className="mt-8 space-y-4">
        {flags.map((f) => (
          <li key={f.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{f.expense.campaign.title}</p>
                <p className="text-sm">
                  {f.expense.vendor} · {formatInr(f.expense.amountInr)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{f.reason}</p>
                <div className="mt-2 flex gap-2">
                  <Badge>{f.ruleId}</Badge>
                  <Badge variant="accent">{f.severity}</Badge>
                  <Badge variant="secondary">{f.status}</Badge>
                </div>
              </div>
              <ReviewActions url={`/api/admin/flags/${f.id}`} approveValue="CLEARED" rejectValue="ESCALATED" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
