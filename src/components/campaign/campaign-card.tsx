import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { daysLeft, formatInr } from "@/lib/format";

export function CampaignCard({
  id,
  title,
  ngoName,
  verified,
  coverPath,
  raisedInr,
  goalInr,
  endDate,
}: {
  id: string;
  title: string;
  ngoName: string;
  verified: boolean;
  coverPath?: string | null;
  raisedInr: number;
  goalInr: number;
  endDate: Date;
}) {
  const pct = goalInr ? Math.min(100, (raisedInr / goalInr) * 100) : 0;
  return (
    <Link href={`/campaigns/${id}`} className="block h-full">
      <Card className="h-full overflow-hidden shadow-card transition-shadow hover:shadow-md">
        <div className="relative h-36 bg-gradient-to-br from-primary/80 to-primary/40">
          {coverPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/files/public/${coverPath}`}
              alt=""
              className="h-36 w-full object-cover"
            />
          ) : null}
        </div>
        <CardHeader className="space-y-2">
          <CardTitle className="text-base leading-snug">{title}</CardTitle>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {ngoName}
            {verified ? <Badge variant="secondary">Verified</Badge> : null}
          </p>
        </CardHeader>
        <CardContent>
          <Progress value={pct} />
          <p className="mt-3 text-sm">
            {formatInr(raisedInr)}{" "}
            <span className="text-muted-foreground">of {formatInr(goalInr)}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{daysLeft(endDate)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
