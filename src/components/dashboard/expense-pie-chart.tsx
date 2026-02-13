"use client";

import { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";
import { useTranslation } from "react-i18next";
import { formatVNCurrency } from "@/lib/format";
import { Transaction } from "@/types";
import { REPORT_TRANSACTION_LIMIT } from "@/lib/constants";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
} from "@/components/ui/chart";

export function ExpensePieChart({ data }: { data: { category: string; amount: number; fill: string; transactions: Transaction[] }[] }) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'vi' ? vi : enUS;
    const chartConfig = {
        amount: {
            label: t('common.amount'),
        },
        // We would dynamic generate config for colors if strictly following shadcn pattern
        // For now we pass fill color in data
    } satisfies ChartConfig;

    const total = useMemo(() => {
        return data.reduce((acc, curr) => acc + curr.amount, 0);
    }, [data]);

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>{t('report.monthlyExpense')}</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto h-[350px] w-full"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    const topTransactions = data.transactions.slice(0, REPORT_TRANSACTION_LIMIT);
                                    const percentage = total > 0 ? ((data.amount / total) * 100).toFixed(1) : "0";

                                    return (
                                        <div className="bg-background border rounded-lg p-3 shadow-lg text-xs w-[280px] z-50">
                                            <div className="flex items-center justify-between mb-2 pb-2 border-b">
                                                <span className="font-bold text-sm" style={{ color: data.fill }}>{data.category}</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-mono font-bold text-sm">{formatVNCurrency(data.amount)}</span>
                                                    <span className="text-[10px] text-muted-foreground">({percentage}%)</span>
                                                </div>
                                            </div>

                                            {topTransactions.length > 0 && (
                                                <div className="space-y-2">
                                                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">{t('transaction.recent')}</span>
                                                    {topTransactions.map((tx: Transaction, i: number) => (
                                                        <div key={i} className="flex justify-between items-start gap-2">
                                                            <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                                                                <span className="truncate opacity-80" title={tx.note}>{tx.note || t('common.none')}</span>
                                                                <span className="text-[10px] opacity-60">{format(new Date(tx.date), "dd/MM", { locale })}</span>
                                                            </div>
                                                            <span className="font-medium whitespace-nowrap text-red-500">
                                                                -{formatVNCurrency(tx.amount)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {data.transactions.length > REPORT_TRANSACTION_LIMIT && (
                                                        <p className="text-[10px] text-center text-muted-foreground italic pt-1">
                                                            (+{data.transactions.length - REPORT_TRANSACTION_LIMIT} {t('common.more')})
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Pie
                            data={data}
                            dataKey="amount"
                            nameKey="category"
                            innerRadius={100}
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
