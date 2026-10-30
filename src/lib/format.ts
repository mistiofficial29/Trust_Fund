export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function daysLeft(endDate: Date | string) {
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Ended";
  if (diff === 0) return "Ends today";
  return `${diff} day${diff === 1 ? "" : "s"} left`;
}

export function categoryLabel(value: string) {
  const map: Record<string, string> = {
    FLOOD_RELIEF: "Flood Relief",
    EDUCATION: "Education",
    HEALTHCARE: "Healthcare",
    FOOD_NUTRITION: "Food & Nutrition",
    WOMEN_EMPOWERMENT: "Women Empowerment",
    ENVIRONMENT: "Environment",
    ANIMAL_WELFARE: "Animal Welfare",
    TRUST: "Trust",
    SOCIETY: "Society",
    SECTION_8: "Section 8 Company",
  };
  return map[value] ?? value;
}

export function inrToEth(amountInr: number, rate = Number(process.env.NEXT_PUBLIC_INR_PER_ETH ?? 250000)) {
  return amountInr / rate;
}

export function ethToWeiString(eth: number) {
  const wei = BigInt(Math.round(eth * 1e18));
  return wei.toString();
}

export function shortHash(hash: string) {
  if (hash.length < 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}
