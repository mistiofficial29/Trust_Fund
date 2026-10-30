import { createHash } from "crypto";

export function sha256Buffer(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}

export function sha256String(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
