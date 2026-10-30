"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ReviewActions({
  url,
  approveValue,
  rejectValue,
}: {
  url: string;
  approveValue: string;
  rejectValue: string;
}) {
  const router = useRouter();
  async function send(status: string) {
    const notes = window.prompt("Optional remarks") ?? undefined;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, remarks: notes, notes }),
    });
    if (!res.ok) {
      toast.error("Could not update");
      return;
    }
    toast.success("Updated");
    router.refresh();
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => void send(approveValue)}>
        Approve
      </Button>
      <Button size="sm" variant="outline" onClick={() => void send(rejectValue)}>
        Reject
      </Button>
    </div>
  );
}
