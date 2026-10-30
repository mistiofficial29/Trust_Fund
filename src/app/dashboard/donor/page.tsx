import { Heart } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDate, formatInr } from "@/lib/format";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DonorDashboard() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const donations = await db.donation.findMany({
    where: { donorId: session.user.id },
    include: {
      campaign: { include: { budgetItems: true, expenses: { include: { budgetItem: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold">My donations</h1>
      <p className="mt-1 text-sm text-muted-foreground">Impact shares are estimates based on campaign spending so far.</p>
      {donations.length === 0 ? (
        <EmptyState className="mt-8" icon={Heart} title="No gifts yet" description="Browse campaigns and give when you are ready." />
      ) : (
        <div className="mt-8 space-y-4">
          {donations.map((d) => {
            const spent = d.campaign.expenses.reduce((s, e) => s + e.amountInr, 0);
            const share = d.campaign.raisedInr ? d.amountInr / d.campaign.raisedInr : 0;
            const byCat = d.campaign.budgetItems.map((item) => {
              const catSpent = d.campaign.expenses
                .filter((e) => e.budgetItemId === item.id)
                .reduce((s, e) => s + e.amountInr, 0);
              return { name: item.category, estimate: Math.round(catSpent * share) };
            });
            return (
              <Card key={d.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    <Link className="hover:underline" href={`/campaigns/${d.campaign.id}`}>
                      {d.campaign.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    You gave {formatInr(d.amountInr)} on {formatDate(d.createdAt)}
                  </p>
                  <p className="text-muted-foreground">
                    Campaign has spent {formatInr(spent)} of {formatInr(d.campaign.raisedInr)} raised.
                  </p>
                  <ul className="text-muted-foreground">
                    {byCat.map((c) => (
                      <li key={c.name}>
                        Estimate of your share toward {c.name}: {formatInr(c.estimate)}{" "}
                        <span className="text-xs">(demo-derived estimate)</span>
                      </li>
                    ))}
                  </ul>
                  <Link className="text-primary underline-offset-4 hover:underline" href={`/dashboard/donor/receipt/${d.id}`}>
                    Printable receipt
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
