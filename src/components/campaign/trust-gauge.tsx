import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function TrustGauge({ score }: { score: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="rounded-xl border bg-card p-4" aria-label={`Trust score ${score} out of 100`}>
          <p className="text-xs text-muted-foreground">Trust score</p>
          <p className="text-2xl font-semibold">{score}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">
        How is this calculated? Verification completeness, approved documents, share of expenses with
        bills, flag history, and how often the NGO posts updates.
      </TooltipContent>
    </Tooltip>
  );
}
