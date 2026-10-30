import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const ALLOWED: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/svg+xml": [".svg"],
};

const MAX_BYTES = 5 * 1024 * 1024;

export class StorageService {
  async save(file: { buffer: Buffer; mimeType: string; originalName: string }) {
    const ext = path.extname(file.originalName).toLowerCase();
    const allowedExt = ALLOWED[file.mimeType];
    if (!allowedExt || !allowedExt.includes(ext)) {
      throw new Error("That file type is not allowed. Use PDF, JPG or PNG.");
    }
    if (file.buffer.length > MAX_BYTES) {
      throw new Error("Each file must be 5 MB or smaller.");
    }
    await mkdir(UPLOAD_ROOT, { recursive: true });
    const name = `${randomBytes(16).toString("hex")}${ext}`;
    const dest = path.join(UPLOAD_ROOT, name);
    await writeFile(dest, file.buffer);
    return { relativePath: name, mimeType: file.mimeType };
  }

  async read(relativePath: string) {
    const safe = path.basename(relativePath);
    return readFile(path.join(UPLOAD_ROOT, safe));
  }

  absolute(relativePath: string) {
    return path.join(UPLOAD_ROOT, path.basename(relativePath));
  }
}

export const storage = new StorageService();
