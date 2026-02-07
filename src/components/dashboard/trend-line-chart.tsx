"use client"
import { CartesianGrid, XAxis, YAxis, Area, AreaChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatVNCurrency } from "@/lib/format"

interface TrendData {
    date: string;
    income: number;
    expense: number;
}

export function TrendLineChart({ data }: { data: TrendData[] }) {
    const { t } = useTranslation();
    const chartConfig = {
        income: { label: t('transaction.income'), color: "#22c55e" },
        expense: { label: t('transaction.expense'), color: "#ef4444" },
    } satisfies ChartConfig

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('report.trend')}</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <AreaChart data={data} margin={{ left: 0, right: 12, top: 12 }}>
                        <defs>
                            <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                try {
                                    const date = new Date(value);
                                    return date.toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" });
                                } catch {
                                    return value;
                                }
                            }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                return value;
                            }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" formatter={(value) => formatVNCurrency(Number(value))} />}
                        />
                        <Area
                            dataKey="income"
                            type="monotone"
                            fill="url(#fillIncome)"
                            stroke="var(--color-income)"
                            stackId="a"
                        />
                        <Area
                            dataKey="expense"
                            type="monotone"
                            fill="url(#fillExpense)"
                            stroke="var(--color-expense)"
                            stackId="b"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
