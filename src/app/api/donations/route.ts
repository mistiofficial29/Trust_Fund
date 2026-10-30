import { NextResponse } from "next/server";

import { getContractAddress, getProvider, trustFundInterface } from "@/lib/chain";
import { INR_PER_ETH } from "@/lib/constants";
import { db } from "@/lib/db";
import { ethToWeiString, inrToEth } from "@/lib/format";
import { getSession } from "@/lib/session";
import { donationSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await getSession();
  const parsed = donationSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const campaign = await db.campaign.findUnique({ where: { id: parsed.data.campaignId } });
  if (!campaign || campaign.status !== "ACTIVE") {
    return NextResponse.json({ error: "This campaign is not accepting gifts." }, { status: 400 });
  }
  const existing = await db.donation.findFirst({ where: { txHash: parsed.data.txHash } });
  if (existing) {
    return NextResponse.json(existing);
  }

  try {
    const provider = getProvider();
    const tx = await provider.getTransaction(parsed.data.txHash);
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found on the chain yet. Wait a moment and retry." }, { status: 400 });
    }
    if (tx.from.toLowerCase() !== parsed.data.wallet.toLowerCase()) {
      return NextResponse.json({ error: "Wallet does not match the transaction." }, { status: 400 });
    }
    const contract = getContractAddress();
    if (contract && tx.to?.toLowerCase() !== contract.toLowerCase()) {
      return NextResponse.json({ error: "Transaction was not sent to the TrustFund contract." }, { status: 400 });
    }
    const decoded = trustFundInterface.parseTransaction({ data: tx.data, value: tx.value });
    if (!decoded || decoded.name !== "donate") {
      return NextResponse.json({ error: "That transaction is not a donation." }, { status: 400 });
    }
    const expectedWei = BigInt(ethToWeiString(inrToEth(parsed.data.amountInr, INR_PER_ETH)));
    if (tx.value < expectedWei - BigInt(1e12)) {
      return NextResponse.json({ error: "On-chain amount does not match." }, { status: 400 });
    }
    const receipt = await provider.getTransactionReceipt(parsed.data.txHash);
    if (!receipt || receipt.status !== 1) {
      return NextResponse.json({ error: "Transaction is not confirmed yet." }, { status: 400 });
    }

    const donation = await db.donation.create({
      data: {
        campaignId: campaign.id,
        donorId: session?.user?.role === "DONOR" ? session.user.id : null,
        anonymous: Boolean(parsed.data.anonymous),
        donorName: parsed.data.anonymous ? null : parsed.data.donorName ?? session?.user?.name,
        amountInr: parsed.data.amountInr,
        amountWei: tx.value.toString(),
        txHash: parsed.data.txHash,
        blockNumber: receipt.blockNumber,
        message: parsed.data.message,
        wallet: parsed.data.wallet,
      },
    });
    await db.campaign.update({
      where: { id: campaign.id },
      data: { raisedInr: { increment: parsed.data.amountInr } },
    });
    return NextResponse.json(donation);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          "Could not verify the transaction. Start the local Hardhat node, deploy the contract, and try again.",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 503 },
    );
  }
}
