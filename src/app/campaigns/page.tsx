import { LayoutGrid } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Campaigns",
};

export default function CampaignsPage() {
  return (
    <ComingSoon
      icon={LayoutGrid}
      title="Campaigns will appear here"
      description="In the next phase we will load demo campaigns you can search, filter and open. Nothing is missing from your setup — the list is waiting for seed data."
    />
  );
}
