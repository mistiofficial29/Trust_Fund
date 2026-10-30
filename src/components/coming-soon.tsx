import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";

export function ComingSoon({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <EmptyState icon={icon} title={title} description={description} />
    </div>
  );
}
