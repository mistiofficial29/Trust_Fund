import type { Metadata } from "next";
import Link from "next/link";

import { CampaignCard } from "@/components/campaign/campaign-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CAMPAIGN_CATEGORIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { LayoutGrid } from "lucide-react";

export const metadata: Metadata = {
  title: "Campaigns",
};

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; status?: string; sort?: string; page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const take = 9;
  const where = {
    status:
      searchParams.status && searchParams.status !== "all"
        ? searchParams.status
        : { in: ["ACTIVE", "COMPLETED", "PAUSED"] },
    category: searchParams.category && searchParams.category !== "all" ? searchParams.category : undefined,
    OR: searchParams.q
      ? [
          { title: { contains: searchParams.q } },
          { summary: { contains: searchParams.q } },
          { ngo: { legalName: { contains: searchParams.q } } },
        ]
      : undefined,
  };

  const orderBy =
    searchParams.sort === "ending"
      ? { endDate: "asc" as const }
      : searchParams.sort === "newest"
        ? { createdAt: "desc" as const }
        : { raisedInr: "desc" as const };

  const [total, campaigns] = await Promise.all([
    db.campaign.count({ where }),
    db.campaign.findMany({
      where,
      include: { ngo: true },
      orderBy,
      skip: (page - 1) * take,
      take,
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / take));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
      <p className="mt-2 text-sm text-muted-foreground">Search, filter and open a campaign to see where money went.</p>

      <form className="mt-6 grid gap-3 md:grid-cols-4" method="get">
        <Input name="q" placeholder="Search campaigns" defaultValue={searchParams.q} aria-label="Search" />
        <select
          name="category"
          defaultValue={searchParams.category ?? "all"}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          aria-label="Category"
        >
          <option value="all">All categories</option>
          {CAMPAIGN_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={searchParams.status ?? "all"}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          aria-label="Status"
        >
          <option value="all">Active & completed</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <div className="flex gap-2">
          <select
            name="sort"
            defaultValue={searchParams.sort ?? "funded"}
            className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm"
            aria-label="Sort"
          >
            <option value="funded">Most funded</option>
            <option value="ending">Ending soon</option>
            <option value="newest">Newest</option>
          </select>
          <Button type="submit">Apply</Button>
        </div>
      </form>

      {campaigns.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={LayoutGrid}
          title="No campaigns match"
          description="Try another search or clear filters. If this is a fresh install, run the seed script."
        />
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
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
      )}

      {pages > 1 ? (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={p === page ? "default" : "outline"} size="sm" asChild>
              <Link
                href={`/campaigns?q=${searchParams.q ?? ""}&category=${searchParams.category ?? "all"}&status=${searchParams.status ?? "all"}&sort=${searchParams.sort ?? "funded"}&page=${p}`}
              >
                {p}
              </Link>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
