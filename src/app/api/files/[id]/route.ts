import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { SENSITIVE_DOC_TYPES } from "@/lib/constants";
import { getSession } from "@/lib/session";
import { storage } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const doc = await db.document.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getSession();
  const role = session?.user?.role;
  const userId = session?.user?.id;

  if (SENSITIVE_DOC_TYPES.has(doc.type) || (doc.ownerType === "NGO" && doc.type !== "COVER")) {
    const ngo = doc.ownerType === "NGO" ? await db.ngoProfile.findUnique({ where: { id: doc.ownerId } }) : null;
    const isOwner = ngo && ngo.userId === userId;
    if (role !== "ADMIN" && !isOwner) {
      return NextResponse.json(
        { type: doc.type, status: doc.status, sha256: doc.sha256, error: "File restricted" },
        { status: 403 },
      );
    }
  }

  try {
    const buf = await storage.read(doc.fileUrl);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${doc.originalName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Missing file" }, { status: 404 });
  }
}
