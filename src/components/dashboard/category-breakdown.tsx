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
                <ChartContainer config={chartConfig} className={`w-full ${data.length <= 3 ? 'h-[150px]' : 'h-[300px]'}`}>
                    <BarChart
                        accessibilityLayer
                        data={sortedData}
                        layout="vertical"
                        margin={{ left: 80, right: 40 }}
                        barSize={16}
                        barGap={0}
                    >
                        <YAxis
                            dataKey="category"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            width={160}
                            fontSize={12}
                        />
                        <XAxis dataKey="amount" type="number" hide />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel formatter={(value, name) => (
                                <div className="flex items-center justify-between gap-4 w-full">
                                    <span className="text-muted-foreground">{name}:</span>
                                    <span className="font-mono font-medium">{formatVNCurrency(Number(value))}</span>
                                </div>
                            )} />}
                        />
                        <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
