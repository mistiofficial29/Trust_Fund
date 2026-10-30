"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { shortHash } from "@/lib/format";

export function CopyHash({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs">
      {shortHash(value)}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        aria-label="Copy hash"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
      >
        {done ? <Check /> : <Copy />}
      </Button>
    </span>
  );
}
