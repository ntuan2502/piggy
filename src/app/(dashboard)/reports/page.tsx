"use client";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useMemo } from "react";
import { ExpensePieChart } from "@/components/dashboard/expense-pie-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useTranslation } from "react-i18next";

export default function ReportsPage() {
    const { t } = useTranslation();
    const { transactions, loading } = useTransactions();
    const { categories } = useCategories();

    // Prepare Pie Data
    const pieData = useMemo(() => {
        const expenseMap: Record<string, number> = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const catName = categories.find(c => c.id === t.categoryId)?.name || "Unknown";
            expenseMap[catName] = (expenseMap[catName] || 0) + t.amount;
        });

        // Colors palette
        const colors = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#f43f5e"];

        return Object.entries(expenseMap).map(([category, amount], index) => ({
            category,
            amount,
            fill: colors[index % colors.length],
        }));
    }, [transactions, categories]);

    // Prepare Bar Data (Income vs Expense)
    const barData = useMemo(() => {
        let income = 0;
        let expense = 0;
        transactions.forEach(t => {
            if (t.type === 'income' || t.type === 'debt') income += t.amount;
            else if (t.type === 'expense' || t.type === 'loan') expense += t.amount;
        });
        return [{ metric: "Total", income, expense }];
    }, [transactions]);

    const barConfig = {
        income: { label: "Income", color: "#22c55e" },
        expense: { label: "Expense", color: "#ef4444" },
    } satisfies ChartConfig;

    if (loading) return <div>{t('common.loading')}</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">{t('report.title')}</h2>
            <div className="grid gap-4 md:grid-cols-2">
                <ExpensePieChart data={pieData} />

                <Card>
                    <CardHeader>
                        <CardTitle>{t('report.incomeVsExpense')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={barConfig} className="min-h-[200px] w-full">
                            <BarChart accessibilityLayer data={barData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="metric" tickLine={false} tickMargin={10} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                                <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
