"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function SpendDonut({
  data,
}: {
  data: { name: string; spent: number; budget: number }[];
}) {
  const chart = data.map((d) => ({ name: d.name, value: d.spent }));
  if (chart.every((d) => d.value === 0)) {
    return <p className="text-sm text-muted-foreground">No spending recorded yet.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={chart} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {chart.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
