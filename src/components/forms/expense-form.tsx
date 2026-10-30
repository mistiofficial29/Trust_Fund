"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ExpenseForm({
  campaigns,
}: {
  campaigns: { id: string; title: string; budgetItems: { id: string; category: string }[] }[];
}) {
  const router = useRouter();
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const campaign = campaigns.find((c) => c.id === campaignId);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const file = form.get("bill");
    if (!(file instanceof File) || !file.size) {
      toast.error("A bill or receipt is required.");
      return;
    }
    setBusy(true);
    const upload = new FormData();
    upload.set("file", file);
    upload.set("ownerType", "EXPENSE");
    upload.set("ownerId", campaignId);
    upload.set("type", "BILL");
    const up = await fetch("/api/uploads", { method: "POST", body: upload });
    if (!up.ok) {
      setBusy(false);
      toast.error("Could not upload the bill.");
      return;
    }
    const photo = form.get("photo");
    if (photo instanceof File && photo.size) {
      const p = new FormData();
      p.set("file", photo);
      p.set("ownerType", "EXPENSE");
      p.set("ownerId", campaignId);
      p.set("type", "PHOTO");
      await fetch("/api/uploads", { method: "POST", body: p });
    }
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId,
        budgetItemId: form.get("budgetItemId"),
        vendor: form.get("vendor"),
        invoiceNo: form.get("invoiceNo") || undefined,
        amountInr: Number(form.get("amountInr")),
        description: form.get("description"),
        quantity: form.get("quantity") || undefined,
        billDate: form.get("billDate"),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(typeof data.error === "string" ? data.error : "Could not save expense");
      return;
    }
    if (data.analysis?.flags?.length) {
      toast.message("Saved. Checks marked this bill for review.");
    } else {
      toast.success("Expense saved.");
    }
    formEl.reset();
    router.refresh();
  }

  if (!campaigns.length) {
    return <p className="text-sm text-muted-foreground">Create and activate a campaign before logging expenses.</p>;
  }

  return (
    <form className="grid max-w-xl gap-3" onSubmit={onSubmit}>
      <div>
        <Label>Campaign</Label>
        <select className="h-10 w-full rounded-xl border px-3 text-sm" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Budget line</Label>
        <select name="budgetItemId" className="h-10 w-full rounded-xl border px-3 text-sm" required>
          {campaign?.budgetItems.map((b) => (
            <option key={b.id} value={b.id}>
              {b.category}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Vendor</Label>
        <Input name="vendor" required />
      </div>
      <div>
        <Label>Invoice number</Label>
        <Input name="invoiceNo" />
      </div>
      <div>
        <Label>Amount (₹)</Label>
        <Input name="amountInr" type="number" required min={1} />
      </div>
      <div>
        <Label>Date on bill</Label>
        <Input name="billDate" type="date" required />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea name="description" required />
      </div>
      <div>
        <Label>Quantity / unit</Label>
        <Input name="quantity" />
      </div>
      <div>
        <Label>Bill / receipt (required)</Label>
        <Input name="bill" type="file" accept=".pdf,.jpg,.jpeg,.png" required />
      </div>
      <div>
        <Label>Photo of delivered items (optional)</Label>
        <Input name="photo" type="file" accept=".jpg,.jpeg,.png" />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Log expense"}
      </Button>
    </form>
  );
}
