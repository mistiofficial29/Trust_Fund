import Link from "next/link";
import { redirect } from "next/navigation";

import { ReviewActions } from "@/components/admin/review-actions";
import { CopyHash } from "@/components/campaign/copy-hash";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function AdminNgos() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const ngos = await db.ngoProfile.findMany({ orderBy: { createdAt: "desc" } });
  const docs = await db.document.findMany({ where: { ownerType: "NGO" } });
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold">NGO verification queue</h1>
      <ul className="mt-8 space-y-4">
        {ngos.map((ngo) => {
          const files = docs.filter((d) => d.ownerId === ngo.id);
          return (
            <li key={ngo.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{ngo.legalName}</p>
                  <p className="text-sm text-muted-foreground">
                    {ngo.city}, {ngo.state} · {ngo.verificationStatus}
                  </p>
                  <Link className="text-sm text-primary underline" href={`/ngos/${ngo.id}`}>
                    Public profile
                  </Link>
                </div>
                <ReviewActions url={`/api/admin/ngos/${ngo.id}`} approveValue="VERIFIED" rejectValue="REJECTED" />
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {files.map((f) => (
                  <li key={f.id}>
                    {f.type} · {f.status} · <CopyHash value={f.sha256} /> ·{" "}
                    <a className="underline" href={`/api/files/${f.id}`}>
                      Open
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
