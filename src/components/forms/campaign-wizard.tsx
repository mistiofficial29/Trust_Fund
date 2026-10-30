"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CAMPAIGN_CATEGORIES } from "@/lib/constants";
import { formatInr } from "@/lib/format";

const DRAFT_KEY = "trustfund-campaign-draft";

type Budget = { category: string; amountInr: number };

export function CampaignWizard({ verified }: { verified: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [story, setStory] = useState("");
  const [category, setCategory] = useState("FLOOD_RELIEF");
  const [state, setStateName] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [goalInr, setGoal] = useState(100000);
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");
  const [beneficiaries, setBeneficiaries] = useState(50);
  const [budget, setBudget] = useState<Budget[]>([
    { category: "Food", amountInr: 40000 },
    { category: "Medicines", amountInr: 25000 },
    { category: "Clothes", amountInr: 20000 },
    { category: "Logistics", amountInr: 15000 },
  ]);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      setTitle(d.title ?? "");
      setSummary(d.summary ?? "");
      setStory(d.story ?? "");
      setCategory(d.category ?? "FLOOD_RELIEF");
      setStateName(d.state ?? "");
      setDistrict(d.district ?? "");
      setArea(d.area ?? "");
      setGoal(d.goalInr ?? 100000);
      setStart(d.startDate ?? "");
      setEnd(d.endDate ?? "");
      setBeneficiaries(d.beneficiaries ?? 50);
      if (d.budgetItems) setBudget(d.budgetItems);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          title,
          summary,
          story,
          category,
          state,
          district,
          area,
          goalInr,
          startDate,
          endDate,
          beneficiaries,
          budgetItems: budget,
        }),
      );
    }, 400);
    return () => clearTimeout(t);
  }, [title, summary, story, category, state, district, area, goalInr, startDate, endDate, beneficiaries, budget]);

  const budgetSum = budget.reduce((s, b) => s + Number(b.amountInr || 0), 0);

  async function save(submit: boolean) {
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        summary,
        story,
        category,
        state,
        district,
        area,
        goalInr,
        startDate,
        endDate,
        beneficiaries,
        budgetItems: budget,
        submit,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(typeof data.error === "string" ? data.error : "Fix the highlighted fields and try again.");
      return;
    }
    localStorage.removeItem(DRAFT_KEY);
    toast.success(submit ? "Submitted for review" : "Draft saved");
    router.push("/dashboard/ngo");
    router.refresh();
  }

  return (
    <div>
      <ol className="mb-8 flex gap-2 text-sm">
        {["Basics", "Funding & Budget", "Documents", "Review"].map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 ${step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <div className="grid gap-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Short summary</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div>
            <Label>Full story (plain text or simple HTML)</Label>
            <Textarea value={story} onChange={(e) => setStory(e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <select className="h-10 w-full rounded-xl border px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CAMPAIGN_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>State</Label>
              <Input value={state} onChange={(e) => setStateName(e.target.value)} />
            </div>
            <div>
              <Label>District</Label>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} />
            </div>
            <div>
              <Label>Village / area</Label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div>
            <Label>Funding goal (₹)</Label>
            <Input type="number" value={goalInr} onChange={(e) => setGoal(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">Min ₹10,000, max ₹1 crore.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>End date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>People / families helped (approx.)</Label>
            <Input type="number" value={beneficiaries} onChange={(e) => setBeneficiaries(Number(e.target.value))} />
          </div>
          <div>
            <p className="text-sm font-medium">Budget plan (must equal {formatInr(goalInr)})</p>
            {budget.map((row, i) => (
              <div key={i} className="mt-2 grid grid-cols-2 gap-2">
                <Input
                  value={row.category}
                  onChange={(e) =>
                    setBudget(budget.map((b, idx) => (idx === i ? { ...b, category: e.target.value } : b)))
                  }
                />
                <Input
                  type="number"
                  value={row.amountInr}
                  onChange={(e) =>
                    setBudget(budget.map((b, idx) => (idx === i ? { ...b, amountInr: Number(e.target.value) } : b)))
                  }
                />
              </div>
            ))}
            <Button type="button" variant="outline" className="mt-2" onClick={() => setBudget([...budget, { category: "", amountInr: 0 }])}>
              Add line
            </Button>
            <p className={`mt-2 text-sm ${budgetSum === goalInr ? "text-muted-foreground" : "text-destructive"}`}>
              Sum: {formatInr(budgetSum)}
            </p>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <p className="text-sm text-muted-foreground">
          After you save a draft you can upload supporting documents (needs-assessment, quotations) from the NGO
          dashboard. Cover images can be added the same way.
        </p>
      ) : null}

      {step === 4 ? (
        <div className="space-y-2 text-sm">
          <p>
            <strong>{title}</strong>
          </p>
          <p>{summary}</p>
          <p>
            Goal {formatInr(goalInr)} · {state} · {beneficiaries} people
          </p>
          {!verified ? (
            <p className="text-destructive">You can save a draft. Publishing needs a verified NGO profile.</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 flex gap-2">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        ) : null}
        {step < 4 ? (
          <Button type="button" onClick={() => setStep(step + 1)}>
            Next
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={() => void save(false)}>
              Save draft
            </Button>
            <Button type="button" disabled={!verified} onClick={() => void save(true)}>
              Submit for approval
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
