export function computeTrustScore(input: {
  ngoVerified: boolean;
  govtAffiliated: boolean;
  approvedDocCount: number;
  expensesWithBills: number;
  expenseCount: number;
  openHighFlags: number;
  openFlags: number;
  updateCount: number;
}) {
  let score = 40;
  if (input.ngoVerified) score += 20;
  if (input.govtAffiliated) score += 5;
  score += Math.min(15, input.approvedDocCount * 3);
  const coverage = input.expenseCount === 0 ? 0.5 : input.expensesWithBills / input.expenseCount;
  score += Math.round(coverage * 15);
  score -= input.openHighFlags * 12;
  score -= input.openFlags * 4;
  score += Math.min(8, input.updateCount * 2);
  return Math.max(0, Math.min(100, score));
}
