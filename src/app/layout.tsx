import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteShell } from "@/components/layout/site-shell";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { site } from "@/lib/site";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.pitch,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TooltipProvider delayDuration={200}>
            <SiteShell>{children}</SiteShell>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
