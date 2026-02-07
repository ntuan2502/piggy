"use client"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatVNCurrency } from "@/lib/format"

interface CategoryData {
    category: string;
    amount: number;
    fill?: string;
}

export function CategoryBreakdown({ data }: { data: CategoryData[] }) {
    const { t } = useTranslation();

    // Sort data descending by amount
    const sortedData = [...data].sort((a, b) => b.amount - a.amount).slice(0, 10);

    const chartConfig = {
        amount: { label: t('common.amount'), color: "#6366f1" },
    } satisfies ChartConfig

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('report.topCategories')}</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart
                        accessibilityLayer
                        data={sortedData}
                        layout="vertical"
                        margin={{ left: 80 }}
                    >
                        <YAxis
                            dataKey="category"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            width={120}
                        />
                        <XAxis dataKey="amount" type="number" hide />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel formatter={(value) => formatVNCurrency(Number(value))} />}
                        />
                        <Bar dataKey="amount" fill="var(--color-amount)" radius={5} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
