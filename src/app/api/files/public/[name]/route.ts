import { NextResponse } from "next/server";

import { storage } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const name = params.name;
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const buf = await storage.read(name);
    const ext = name.split(".").pop();
    const type =
      ext === "svg" ? "image/svg+xml" : ext === "png" ? "image/png" : ext === "pdf" ? "application/pdf" : "image/jpeg";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
