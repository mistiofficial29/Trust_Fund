import { HeartHandshake } from "lucide-react";
import Link from "next/link";

import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}
      aria-label={`${site.name} home`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <HeartHandshake className="h-4 w-4" aria-hidden />
      </span>
      {site.name}
    </Link>
  );
}
