import type { Metadata } from "next";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "How it works",
};

const sections = [
  {
    title: "Blockchain, in one sentence",
    body: "Think of it as a digital notebook that many computers keep a copy of. Once a page is written, nobody can quietly tear it out or change the numbers.",
  },
  {
    title: "What a smart contract does",
    body: "It is a small program on that notebook. It records gifts, expense hashes and who is allowed to withdraw — without TrustFund rewriting history later.",
  },
  {
    title: "MetaMask",
    body: "A browser wallet. You approve each gift yourself. In this demo we use a local test chain, so the money is not real.",
  },
  {
    title: "AI checks",
    body: "Simple rules look for duplicate bills, overspending and odd amounts. They raise a flag for a person to review — they do not accuse anyone on their own.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">How TrustFund works</h1>
      <p className="mt-3 text-muted-foreground">
        Plain language only. Technical hashes and block numbers stay behind “Technical details” on
        campaign pages.
      </p>
      <div className="mt-10 space-y-4">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed text-foreground/80">
                {section.body}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
