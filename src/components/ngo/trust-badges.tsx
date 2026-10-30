import { Badge } from "@/components/ui/badge";

export function TrustBadges({
  verified,
  govtAffiliated,
  has12A,
  has80G,
  hasFcra,
}: {
  verified: boolean;
  govtAffiliated: boolean;
  has12A: boolean;
  has80G: boolean;
  hasFcra: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {verified ? <Badge variant="secondary">Verified NGO</Badge> : null}
      {govtAffiliated ? <Badge variant="secondary">Govt. Affiliated</Badge> : null}
      {has12A ? <Badge variant="outline">12A ✓</Badge> : null}
      {has80G ? <Badge variant="outline">80G ✓</Badge> : null}
      {hasFcra ? <Badge variant="outline">FCRA ✓</Badge> : null}
    </div>
  );
}
