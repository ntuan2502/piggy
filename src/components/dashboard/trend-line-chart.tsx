"use client"
import { CartesianGrid, XAxis, YAxis, Area, AreaChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { formatVNCurrency } from "@/lib/format"
import { format } from "date-fns"
import { vi, enUS } from "date-fns/locale"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Transaction } from "@/types"
import { REPORT_TRANSACTION_LIMIT } from "@/lib/constants"

interface TrendData {
    date: string;
    income: number;
    expense: number;
    transactions: Transaction[];
}

export function TrendLineChart({ data }: { data: TrendData[] }) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'vi' ? vi : enUS;
    const [showIncome, setShowIncome] = useState(true);
    const [showExpense, setShowExpense] = useState(true);

    const chartConfig = {
        income: { label: t('transaction.income'), color: "#22c55e" },
        expense: { label: t('transaction.expense'), color: "#ef4444" },
    } satisfies ChartConfig

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>{t('report.trend')}</CardTitle>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="showIncome"
                            checked={showIncome}
                            onCheckedChange={(checked: boolean | "indeterminate") => setShowIncome(!!checked)}
                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                        />
                        <Label htmlFor="showIncome" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-green-600 dark:text-green-500">
                            {t('transaction.income')}
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="showExpense"
                            checked={showExpense}
                            onCheckedChange={(checked: boolean | "indeterminate") => setShowExpense(!!checked)}
                            className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                        />
                        <Label htmlFor="showExpense" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-red-600 dark:text-red-500">
                            {t('transaction.expense')}
                        </Label>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
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
                                    return format(date, "dd/MM", { locale });
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
                            cursor={true}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload as TrendData;
                                    const filteredTransactions = data.transactions.filter(tx => {
                                        const isIncome = tx.type === 'income' || tx.type === 'debt';
                                        if (isIncome && !showIncome) return false;
                                        if (!isIncome && !showExpense) return false;
                                        return true;
                                    });
                                    const topTransactions = filteredTransactions.slice(0, REPORT_TRANSACTION_LIMIT); // Show top 20
                                    return (
                                        <div className="bg-background border rounded-lg p-3 shadow-lg text-xs w-[280px] z-50">
                                            <p className="font-bold mb-2 text-sm border-b pb-2">{format(new Date(label), "dd 'thg' MM, yyyy", { locale })}</p>

                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                {showIncome && (
                                                    <div className="flex flex-col">
                                                        <span className="text-muted-foreground text-[10px] uppercase">{t('transaction.income')}</span>
                                                        <span className="text-green-500 font-bold">{formatVNCurrency(data.income)}</span>
                                                    </div>
                                                )}
                                                {showExpense && (
                                                    <div className="flex flex-col">
                                                        <span className="text-muted-foreground text-[10px] uppercase">{t('transaction.expense')}</span>
                                                        <span className="text-red-500 font-bold">{formatVNCurrency(data.expense)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {topTransactions.length > 0 && (
                                                <div className="space-y-2 mt-2 pt-2 border-t">
                                                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">{t('transaction.recent')}</span>
                                                    {topTransactions.map((tx, i) => (
                                                        <div key={i} className="flex justify-between items-start gap-2">
                                                            <span className="truncate opacity-80 flex-1" title={tx.note}>{tx.note || t('common.none')}</span>
                                                            <span className={`${tx.type === 'income' || tx.type === 'debt' ? 'text-green-500' : 'text-red-500'} font-medium whitespace-nowrap`}>
                                                                {tx.type === 'income' || tx.type === 'debt' ? '+' : '-'}{formatVNCurrency(tx.amount)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {filteredTransactions.length > REPORT_TRANSACTION_LIMIT && (
                                                        <p className="text-[10px] text-center text-muted-foreground italic pt-1">
                                                            (+{filteredTransactions.length - REPORT_TRANSACTION_LIMIT} {t('common.more')})
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
                        <Area
                            dataKey="income"
                            type="monotone"
                            fill="url(#fillIncome)"
                            stroke="var(--color-income)"
                            stackId="a"
                            hide={!showIncome}
                        />
                        <Area
                            dataKey="expense"
                            type="monotone"
                            fill="url(#fillExpense)"
                            stroke="var(--color-expense)"
                            stackId="b"
                            hide={!showExpense}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
