import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function AdminHome() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const [ngos, campaigns, flags] = await Promise.all([
    db.ngoProfile.count({ where: { verificationStatus: { in: ["PENDING", "UNDER_REVIEW"] } } }),
    db.campaign.count({ where: { status: "PENDING_APPROVAL" } }),
    db.fraudFlag.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
  ]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">NGO verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{ngos}</p>
            <Button className="mt-3" variant="outline" asChild>
              <Link href="/dashboard/admin/ngos">Open queue</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaign approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{campaigns}</p>
            <Button className="mt-3" variant="outline" asChild>
              <Link href="/dashboard/admin/campaigns">Open queue</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI flags</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{flags}</p>
            <Button className="mt-3" variant="outline" asChild>
              <Link href="/dashboard/admin/flags">Open queue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
