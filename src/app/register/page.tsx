"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"DONOR" | "NGO">("DONOR");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(typeof data.error === "string" ? data.error : "Could not register");
      return;
    }
    await signIn("credentials", { email, password, redirect: false });
    router.push(role === "NGO" ? "/dashboard/ngo" : "/dashboard/donor");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Choose Donor or NGO. NGOs complete verification before publishing campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">I am a</legend>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="role" checked={role === "DONOR"} onChange={() => setRole("DONOR")} />
                Donor
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="role" checked={role === "NGO"} onChange={() => setRole("NGO")} />
                NGO
              </label>
            </fieldset>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
