"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NGO_DOC_TYPES, REGISTRATION_TYPES } from "@/lib/constants";
import { CopyHash } from "@/components/campaign/copy-hash";

type Doc = { id: string; type: string; sha256: string; status: string };

export function NgoVerificationForm({
  profile,
  docs,
}: {
  profile: Record<string, unknown> | null;
  docs: Doc[];
}) {
  const router = useRouter();
  const [govt, setGovt] = useState(Boolean(profile?.govtAffiliated));
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      legalName: form.get("legalName"),
      registrationType: form.get("registrationType"),
      registrationNumber: form.get("registrationNumber"),
      yearEstablished: Number(form.get("yearEstablished")),
      city: form.get("city"),
      state: form.get("state"),
      website: form.get("website") || "",
      contactPerson: form.get("contactPerson"),
      phone: form.get("phone"),
      email: form.get("email"),
      govtAffiliated: govt,
      govtDepartment: form.get("govtDepartment") || undefined,
      affiliationCertNo: form.get("affiliationCertNo") || undefined,
      parentOrg: form.get("parentOrg") || undefined,
    };
    setBusy(true);
    const res = await fetch("/api/ngo/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error("Please check the form and try again.");
      return;
    }
    toast.success("Profile saved.");
    router.refresh();
    return data;
  }

  async function upload(ownerId: string, type: string, file: File) {
    const form = new FormData();
    form.set("file", file);
    form.set("ownerType", "NGO");
    form.set("ownerId", ownerId);
    form.set("type", type);
    const res = await fetch("/api/uploads", { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Upload failed");
      return;
    }
    toast.success("Document uploaded. Hash saved.");
    router.refresh();
  }

  const ownerId = (profile?.id as string | undefined) ?? "";

  return (
    <div className="space-y-8">
      <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <div className="md:col-span-2">
          <Label htmlFor="legalName">NGO legal name</Label>
          <Input id="legalName" name="legalName" required defaultValue={String(profile?.legalName ?? "")} />
        </div>
        <div>
          <Label>Registration type</Label>
          <select
            name="registrationType"
            defaultValue={String(profile?.registrationType ?? "TRUST")}
            className="mt-1 h-10 w-full rounded-xl border px-3 text-sm"
          >
            {REGISTRATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="registrationNumber">Registration number</Label>
          <Input id="registrationNumber" name="registrationNumber" required defaultValue={String(profile?.registrationNumber ?? "")} />
        </div>
        <div>
          <Label htmlFor="yearEstablished">Year established</Label>
          <Input id="yearEstablished" name="yearEstablished" type="number" required defaultValue={String(profile?.yearEstablished ?? 2015)} />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required defaultValue={String(profile?.city ?? "")} />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" required defaultValue={String(profile?.state ?? "")} />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" defaultValue={String(profile?.website ?? "")} />
        </div>
        <div>
          <Label htmlFor="contactPerson">Contact person</Label>
          <Input id="contactPerson" name="contactPerson" required defaultValue={String(profile?.contactPerson ?? "")} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" required defaultValue={String(profile?.phone ?? "")} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required defaultValue={String(profile?.email ?? "")} />
        </div>
        <fieldset className="md:col-span-2 space-y-2">
          <legend className="text-sm font-medium">Government affiliation</legend>
          <label className="flex gap-2 text-sm">
            <input type="radio" checked={govt} onChange={() => setGovt(true)} />
            Government-affiliated / government-recognised
          </label>
          <label className="flex gap-2 text-sm">
            <input type="radio" checked={!govt} onChange={() => setGovt(false)} />
            Independent (non-government)
          </label>
        </fieldset>
        {govt ? (
          <>
            <div>
              <Label htmlFor="govtDepartment">Department / agency</Label>
              <Input id="govtDepartment" name="govtDepartment" required defaultValue={String(profile?.govtDepartment ?? "")} />
            </div>
            <div>
              <Label htmlFor="affiliationCertNo">Affiliation / empanelment number</Label>
              <Input id="affiliationCertNo" name="affiliationCertNo" required defaultValue={String(profile?.affiliationCertNo ?? "")} />
            </div>
          </>
        ) : null}
        <div className="md:col-span-2">
          <Label htmlFor="parentOrg">Parent / related organisation (optional)</Label>
          <Input id="parentOrg" name="parentOrg" defaultValue={String(profile?.parentOrg ?? "")} />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={busy}>
            Save profile
          </Button>
        </div>
      </form>

      {ownerId ? (
        <div>
          <h2 className="text-lg font-semibold">Documents</h2>
          <p className="text-sm text-muted-foreground">PDF, JPG or PNG. Max 5 MB. Each file is hashed (SHA-256).</p>
          <ul className="mt-4 space-y-4">
            {NGO_DOC_TYPES.map((doc) => {
              const existing = docs.find((d) => d.type === doc.value);
              const required = doc.value === "GOVT_AFFILIATION" ? govt : doc.value === "CERT_80G" ? false : doc.required;
              return (
                <li key={doc.value} className="rounded-xl border p-4">
                  <p className="font-medium">
                    {doc.label} {required ? <span className="text-destructive">*</span> : null}
                  </p>
                  {existing ? (
                    <div className="mt-1 text-sm">
                      Status: {existing.status} · <CopyHash value={existing.sha256} />
                    </div>
                  ) : null}
                  <Input
                    className="mt-2"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void upload(ownerId, doc.value, file);
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Save the profile first, then upload documents.</p>
      )}
    </div>
  );
}
