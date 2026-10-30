import { notFound, redirect } from "next/navigation";

import { db } from "@/lib/db";
import { formatDate, formatInr } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const donation = await db.donation.findUnique({
    where: { id: params.id },
    include: { campaign: true },
  });
  if (!donation || donation.donorId !== session.user.id) notFound();
  return (
    <div className="mx-auto max-w-lg px-4 py-12 print:py-0">
      <p className="text-sm text-muted-foreground">TrustFund demo receipt</p>
      <h1 className="mt-2 text-2xl font-semibold">Gift receipt</h1>
      <p className="mt-6">{formatInr(donation.amountInr)} to {donation.campaign.title}</p>
      <p className="text-sm text-muted-foreground">{formatDate(donation.createdAt)}</p>
      <p className="mt-4 break-all font-mono text-xs">{donation.txHash}</p>
    </div>
  );
}
