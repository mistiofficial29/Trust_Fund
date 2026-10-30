import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { Separator } from "@/components/ui/separator";
import { site } from "@/lib/site";

const footerLinks = [
  { href: "/campaigns", label: "Browse campaigns" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Register as NGO" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <BrandMark />
          <p className="max-w-sm text-sm text-muted-foreground">{site.shortPitch}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Explore</p>
          <ul className="mt-3 space-y-2">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium">Note</p>
          <p className="mt-3 text-sm text-muted-foreground">
            TrustFund is a demonstration of transparent giving. Demo records are labelled and are
            not real donations or real organisations.
          </p>
        </div>
      </div>
      <Separator />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {site.name}</p>
        <p>Built for demo and learning</p>
      </div>
    </footer>
  );
}
