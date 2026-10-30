import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sha256Buffer } from "@/lib/hash";
import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { storage } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const ip = req.headers.get("x-forwarded-for") ?? session.user.id;
  if (!rateLimit(`upload:${ip}`, 12).ok) {
    return NextResponse.json({ error: "Too many uploads. Please wait a moment." }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const ownerType = String(form.get("ownerType") ?? "");
  const ownerId = String(form.get("ownerId") ?? "");
  const type = String(form.get("type") ?? "");
  if (!(file instanceof File) || !ownerType || !ownerId || !type) {
    return NextResponse.json({ error: "Missing file or metadata." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const saved = await storage.save({
      buffer,
      mimeType: file.type || "application/octet-stream",
      originalName: file.name,
    });
    const doc = await db.document.create({
      data: {
        ownerType,
        ownerId,
        type,
        fileUrl: saved.relativePath,
        sha256: sha256Buffer(buffer),
        mimeType: saved.mimeType,
        originalName: file.name,
        status: session.user.role === "ADMIN" ? "APPROVED" : "PENDING",
      },
    });
    return NextResponse.json(doc);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}
