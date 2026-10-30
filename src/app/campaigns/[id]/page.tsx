import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyHash } from "@/components/campaign/copy-hash";
import { TrustGauge } from "@/components/campaign/trust-gauge";
import { SpendDonut } from "@/components/charts/spend-donut";
import { TrustBadges } from "@/components/ngo/trust-badges";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { db } from "@/lib/db";
import { categoryLabel, daysLeft, formatDate, formatInr } from "@/lib/format";
import { ngoBadgeFlags } from "@/lib/ngo-badges";
import { computeTrustScore } from "@/lib/trust-score";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const campaign = await db.campaign.findUnique({ where: { id: params.id } });
  return { title: campaign?.title ?? "Campaign" };
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = await db.campaign.findUnique({
    where: { id: params.id },
    include: {
      ngo: true,
      budgetItems: true,
      donations: { orderBy: { createdAt: "desc" } },
      expenses: { include: { flags: true, budgetItem: true }, orderBy: { billDate: "desc" } },
      updates: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!campaign) notFound();

  const badges = await ngoBadgeFlags(campaign.ngo.id, campaign.ngo.verificationStatus, campaign.ngo.govtAffiliated);
  const docs = await db.document.findMany({
    where: { ownerType: "CAMPAIGN", ownerId: campaign.id },
  });
  const spent = campaign.expenses.reduce((s, e) => s + e.amountInr, 0);
  const openFlags = campaign.expenses.flatMap((e) => e.flags).filter((f) => f.status === "OPEN" || f.status === "UNDER_REVIEW");
  const score = computeTrustScore({
    ngoVerified: campaign.ngo.verificationStatus === "VERIFIED",
    govtAffiliated: campaign.ngo.govtAffiliated,
    approvedDocCount: badges.docs.length + docs.filter((d) => d.status === "APPROVED").length,
    expensesWithBills: campaign.expenses.filter((e) => e.billDocId).length,
    expenseCount: campaign.expenses.length,
    openHighFlags: openFlags.filter((f) => f.severity === "HIGH").length,
    openFlags: openFlags.length,
    updateCount: campaign.updates.length,
  });
  const chart = campaign.budgetItems.map((item) => ({
    name: item.category,
    budget: item.amountInr,
    spent: campaign.expenses.filter((e) => e.budgetItemId === item.id).reduce((s, e) => s + e.amountInr, 0),
  }));
  const pct = campaign.goalInr ? (campaign.raisedInr / campaign.goalInr) * 100 : 0;
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {demoMode ? (
        <p className="mb-4 rounded-xl bg-accent/15 px-4 py-2 text-sm">
          Demo mode. Money on the local chain is not real.
        </p>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="overflow-hidden rounded-xl">
            {campaign.coverPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/files/public/${campaign.coverPath}`}
                alt=""
                className="h-56 w-full object-cover md:h-72"
              />
            ) : (
              <div className="h-56 bg-gradient-to-br from-primary/80 to-primary/40 md:h-72" />
            )}
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">{campaign.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {campaign.area}, {campaign.district}, {campaign.state} · {categoryLabel(campaign.category)}
          </p>
          <div className="mt-3">
            <TrustBadges {...badges} />
          </div>

          <Tabs defaultValue="story" className="mt-8">
            <TabsList className="flex h-auto flex-wrap">
              <TabsTrigger value="story">Story</TabsTrigger>
              <TabsTrigger value="money">Where the money went</TabsTrigger>
              <TabsTrigger value="donors">Donors</TabsTrigger>
              <TabsTrigger value="docs">Documents & Verification</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>
            <TabsContent value="story">
              <div className="prose prose-slate max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: campaign.story }} />
            </TabsContent>
            <TabsContent value="money" className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Raised</CardTitle>
                    <p className="text-xl font-semibold">{formatInr(campaign.raisedInr)}</p>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Spent</CardTitle>
                    <p className="text-xl font-semibold">{formatInr(spent)}</p>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Remaining</CardTitle>
                    <p className="text-xl font-semibold">{formatInr(Math.max(0, campaign.raisedInr - spent))}</p>
                  </CardHeader>
                </Card>
              </div>
              <SpendDonut data={chart} />
              <ul className="space-y-4">
                {campaign.expenses.map((expense) => {
                  const flagged = expense.flags.some((f) => f.status === "OPEN" || f.status === "UNDER_REVIEW");
                  return (
                    <li key={expense.id} className="rounded-xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{expense.vendor}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.budgetItem.category} · {formatDate(expense.billDate)}
                          </p>
                        </div>
                        <p className="font-semibold">{formatInr(expense.amountInr)}</p>
                      </div>
                      <p className="mt-2 text-sm">{expense.description}</p>
                      {flagged ? <Badge variant="accent" className="mt-2">Under review</Badge> : null}
                      <div className="mt-3 flex flex-wrap gap-3 text-sm">
                        {expense.billDocId ? (
                          <a className="text-primary underline-offset-4 hover:underline" href={`/api/files/${expense.billDocId}`}>
                            View bill
                          </a>
                        ) : null}
                        <CopyHash value={expense.billHash} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </TabsContent>
            <TabsContent value="donors">
              <ul className="divide-y rounded-xl border">
                {campaign.donations.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <span>{d.anonymous ? "Anonymous donor" : d.donorName ?? "Donor"}</span>
                    <span className="font-medium">{formatInr(d.amountInr)}</span>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value={d.id}>
                        <AccordionTrigger>Technical details</AccordionTrigger>
                        <AccordionContent>
                          <p>Recorded on blockchain ✓</p>
                          <CopyHash value={d.txHash} />
                          {d.blockNumber ? <p className="mt-1 text-muted-foreground">Block {d.blockNumber}</p> : null}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="docs">
              <p className="text-sm text-muted-foreground">
                Public view shows document type, status and hash. Sensitive files stay with the admin.
              </p>
              <ul className="mt-4 space-y-3">
                {docs.map((doc) => (
                  <li key={doc.id} className="rounded-xl border p-3 text-sm">
                    <p className="font-medium">{doc.type.replaceAll("_", " ")}</p>
                    <p className="text-muted-foreground">{doc.status}</p>
                    <CopyHash value={doc.sha256} />
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-4" asChild>
                <Link href={`/ngos/${campaign.ngo.id}`}>NGO profile</Link>
              </Button>
            </TabsContent>
            <TabsContent value="updates">
              {campaign.updates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No updates yet.</p>
              ) : (
                <ul className="space-y-3">
                  {campaign.updates.map((u) => (
                    <li key={u.id} className="rounded-xl border p-4">
                      <p className="font-medium">{u.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</p>
                      <p className="mt-2 text-sm">{u.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{campaign.ngo.legalName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={pct} />
              <p className="text-sm">
                {formatInr(campaign.raisedInr)} of {formatInr(campaign.goalInr)}
              </p>
              <p className="text-sm text-muted-foreground">
                {campaign.donations.length} donors · {daysLeft(campaign.endDate)}
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground">Recorded on blockchain ✓</p>
                </TooltipTrigger>
                <TooltipContent>Each confirmed gift is written to a shared record nobody can secretly edit.</TooltipContent>
              </Tooltip>
              {campaign.status === "ACTIVE" ? (
                <Button variant="cta" className="w-full" asChild>
                  <Link href={`/donate/${campaign.id}`}>Donate</Link>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">This campaign is not accepting gifts.</p>
              )}
            </CardContent>
          </Card>
          <TrustGauge score={score} />
        </aside>
      </div>
    </div>
  );
}
