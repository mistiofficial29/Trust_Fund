import { Interface, JsonRpcProvider } from "ethers";

const RPC = process.env.RPC_URL ?? "http://127.0.0.1:8545";

export function getProvider() {
  return new JsonRpcProvider(RPC);
}

export function getContractAddress() {
  return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
}

export const trustFundAbi = [
  "function createCampaign(string id, address ngoWallet, uint256 goalWei)",
  "function donate(string campaignId) payable",
  "function recordExpense(string campaignId, string expenseId, uint256 amountWei, bytes32 billHash, string category)",
  "function recordDocumentHash(string entityId, bytes32 docHash)",
  "function withdraw(string campaignId, uint256 amount)",
  "function getCampaign(string id) view returns (address ngoWallet, uint256 goalWei, uint256 raisedWei, uint256 withdrawnWei, bool exists)",
  "event DonationReceived(string campaignId, address donor, uint256 amount, uint256 timestamp)",
  "event ExpenseRecorded(string campaignId, string expenseId, uint256 amount, bytes32 billHash, string category)",
];

export const trustFundInterface = new Interface(trustFundAbi);
