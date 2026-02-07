"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import { useTranslation } from "react-i18next";
import { formatVNCurrency } from "@/lib/format";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

export function ExpensePieChart({ data }: { data: { category: string; amount: number; fill: string }[] }) {
    const { t } = useTranslation();
    const chartConfig = {
        amount: {
            label: "Amount",
        },
        // We would dynamic generate config for colors if strictly following shadcn pattern
        // For now we pass fill color in data
    } satisfies ChartConfig;

    const total = React.useMemo(() => {
        return data.reduce((acc, curr) => acc + curr.amount, 0);
    }, [data]);

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>{t('report.monthlyExpense')}</CardTitle>
                <CardDescription>{t('category.item')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel formatter={(value, name) => (
                                <div className="flex items-center justify-between gap-4 w-full">
                                    <span className="text-muted-foreground">{name}:</span>
                                    <span className="font-mono font-medium">{formatVNCurrency(Number(value))}</span>
                                </div>
                            )} />}
                        />
                        <Pie
                            data={data}
                            dataKey="amount"
                            nameKey="category"
                            innerRadius={60}
                            strokeWidth={5}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-xl font-bold"
                                                >
                                                    {formatVNCurrency(total)}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 20}
                                                    className="fill-muted-foreground text-xs"
                                                >
                                                    {t('common.total')}
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
