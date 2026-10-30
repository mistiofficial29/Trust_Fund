import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function NgoDashboard() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const ngo = await db.ngoProfile.findUnique({
    where: { userId: session.user.id },
    include: { campaigns: true },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">NGO dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Verification: {ngo?.verificationStatus ?? "Not started"}
            {ngo?.adminRemarks ? ` · ${ngo.adminRemarks}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/ngo/verification">Verification</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/ngo/campaigns/new">Create campaign</Link>
          </Button>
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Campaigns</CardTitle>
            <p className="text-2xl font-semibold">{ngo?.campaigns.length ?? 0}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Raised</CardTitle>
            <p className="text-2xl font-semibold">
              {formatInr(ngo?.campaigns.reduce((s, c) => s + c.raisedInr, 0) ?? 0)}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
            <p className="text-2xl font-semibold">{ngo?.verificationStatus ?? "—"}</p>
          </CardHeader>
        </Card>
      </div>
      <div className="mt-8 flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard/ngo/expenses">Log expense</Link>
        </Button>
      </div>
      <ul className="mt-8 space-y-3">
        {ngo?.campaigns.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-4">
            <div>
              <Link className="font-medium hover:underline" href={`/campaigns/${c.id}`}>
                {c.title}
              </Link>
              <p className="text-sm text-muted-foreground">{formatInr(c.raisedInr)} of {formatInr(c.goalInr)}</p>
            </div>
            <Badge variant="secondary">{c.status}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
