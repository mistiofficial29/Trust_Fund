import { BadgeCheck, FileSearch, HeartHandshake, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";

import { CampaignCard } from "@/components/campaign/campaign-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/format";
import { site } from "@/lib/site";

const steps = [
  {
    title: "Give to a campaign",
    description: "Choose a verified cause and donate. Your gift is written to a shared record that nobody can secretly edit.",
    icon: HeartHandshake,
  },
  {
    title: "See where money went",
    description: "NGOs log each expense with a bill. You can open the trail: vendor, amount, and proof.",
    icon: FileSearch,
  },
  {
    title: "Spot anything odd",
    description: "Simple checks flag duplicates, overspending and unusual bills so reviewers can look closer.",
    icon: ShieldCheck,
  },
];

const reasons = [
  {
    title: "Verified organisations",
    body: "NGOs upload registration papers before they can publish a campaign. Badges show what has been checked.",
    icon: BadgeCheck,
  },
  {
    title: "A notebook nobody can rewrite",
    body: "Donations and expense hashes are stored on a blockchain — like a public notebook that keeps every page.",
    icon: Wallet,
  },
  {
    title: "Calm, not noisy",
    body: "You see a summary first. Technical details stay behind a tap, so you are never forced to read a transaction hash.",
    icon: Sparkles,
  },
];

export default async function HomePage() {
  const [raised, campaigns, verifiedNgos, featured] = await Promise.all([
    db.donation.aggregate({ _sum: { amountInr: true } }),
    db.campaign.count({ where: { status: { in: ["ACTIVE", "COMPLETED"] } } }),
    db.ngoProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    db.campaign.findMany({
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
      include: { ngo: true },
      orderBy: { raisedInr: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div>
      <section className="border-b bg-gradient-to-b from-secondary/70 to-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="space-y-6">
            <Badge variant="secondary">Transparent giving, after the donate button</Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              {site.shortPitch}
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {site.pitch}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="cta" size="lg" asChild>
                <Link href="/campaigns">Browse campaigns</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/how-it-works">How it works</Link>
              </Button>
            </div>
          </div>
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>What happens after you give</CardTitle>
              <CardDescription>
                Most sites stop at “donate”. TrustFund follows the rupee into food kits, medicines and bills.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Raised so far", value: formatInr(raised._sum.amountInr ?? 0) },
                { label: "Campaigns", value: String(campaigns) },
                { label: "Verified NGOs", value: String(verifiedNgos) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-muted/70 p-4">
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Three steps. No jargon on this page — just the path from gift to proof.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title}>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle className="text-base">
                  {index + 1}. {step.title}
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Featured campaigns</h2>
              <p className="mt-2 text-sm text-muted-foreground">Demo stories with fictional organisations.</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/campaigns">View all</Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {featured.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                title={campaign.title}
                ngoName={campaign.ngo.legalName}
                verified={campaign.ngo.verificationStatus === "VERIFIED"}
                coverPath={campaign.coverPath}
                raisedInr={campaign.raisedInr}
                goalInr={campaign.goalInr}
                endDate={campaign.endDate}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Why TrustFund</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {reasons.map((reason) => (
            <div key={reason.title} className="space-y-2">
              <reason.icon className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="font-semibold">{reason.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{reason.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
