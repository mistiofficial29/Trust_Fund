import { LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <ComingSoon
      icon={LayoutDashboard}
      title="Dashboards come later"
      description="Donor, NGO and admin dashboards will live under /dashboard once accounts exist."
    />
  );
}
