import { redirect } from "next/navigation";

import { NgoVerificationForm } from "@/components/forms/ngo-verification-form";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function VerificationPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const profile = await db.ngoProfile.findUnique({ where: { userId: session.user.id } });
  const docs = profile
    ? await db.document.findMany({ where: { ownerType: "NGO", ownerId: profile.id } })
    : [];
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">NGO verification</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Status: {profile?.verificationStatus ?? "PENDING"}. Unverified organisations can save campaign drafts only.
      </p>
      <div className="mt-8">
        <NgoVerificationForm profile={profile} docs={docs} />
      </div>
    </div>
  );
}
