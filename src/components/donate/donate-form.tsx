"use client";

import { BrowserProvider, Contract, parseEther } from "ethers";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trustFundAbi } from "@/lib/chain";
import { INR_PER_ETH } from "@/lib/constants";
import { formatInr, inrToEth } from "@/lib/format";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export function DonateForm({
  campaignId,
  onchainId,
  title,
}: {
  campaignId: string;
  onchainId: string;
  title: string;
}) {
  const [amount, setAmount] = useState("500");
  const [anonymous, setAnonymous] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const inr = Number(amount) || 0;
  const eth = inrToEth(inr, INR_PER_ETH);
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

  async function donate() {
    if (!window.ethereum) {
      toast.error("MetaMask not found. Install it to donate.");
      return;
    }
    if (inr < 100) {
      toast.error("Minimum gift is ₹100.");
      return;
    }
    if (!contractAddress) {
      toast.error("Contract is not deployed. Run the Hardhat deploy script first.");
      return;
    }
    setBusy(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337)) {
        toast.message("Switch MetaMask to the local Hardhat network (chain 31337).");
      }
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, trustFundAbi, signer);
      const tx = await contract.donate(onchainId, { value: parseEther(eth.toFixed(8)) });
      toast.message("Waiting for confirmation…");
      const receipt = await tx.wait();
      const wallet = await signer.getAddress();
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          amountInr: inr,
          txHash: receipt.hash,
          anonymous,
          donorName: name,
          message,
          wallet,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save donation");
      setTxHash(receipt.hash);
      toast.success("Gift recorded. Thank you.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Donation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Donate to {title}</h1>
      <p className="text-sm text-muted-foreground">
        Amount in rupees. We show an ETH equivalent at the demo rate of {formatInr(INR_PER_ETH)} per ETH.
      </p>
      <div>
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input id="amount" type="number" min={100} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <p className="mt-1 text-xs text-muted-foreground">About {eth.toFixed(6)} ETH on the demo chain.</p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        Give anonymously
      </label>
      {!anonymous ? (
        <div>
          <Label htmlFor="name">Name to show (optional)</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      ) : null}
      <div>
        <Label htmlFor="msg">Message of support</Label>
        <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      <Button variant="cta" disabled={busy} onClick={donate}>
        {busy ? "Confirming…" : "Confirm in wallet"}
      </Button>
      {txHash ? (
        <p className="break-all text-sm">
          View on blockchain: <span className="font-mono">{txHash}</span>
        </p>
      ) : null}
    </div>
  );
}
