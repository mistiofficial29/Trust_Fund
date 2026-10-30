import { db } from "@/lib/db";

export async function ngoBadgeFlags(ngoId: string, verificationStatus: string, govtAffiliated: boolean) {
  const docs = await db.document.findMany({
    where: { ownerType: "NGO", ownerId: ngoId, status: "APPROVED" },
  });
  const types = new Set(docs.map((d) => d.type));
  return {
    verified: verificationStatus === "VERIFIED",
    govtAffiliated: govtAffiliated && types.has("GOVT_AFFILIATION"),
    has12A: types.has("CERT_12A"),
    has80G: types.has("CERT_80G"),
    hasFcra: types.has("FCRA"),
    docs,
  };
}
