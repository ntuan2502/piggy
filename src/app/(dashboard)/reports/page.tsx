"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";

import { ExpensePieChart } from "@/components/dashboard/expense-pie-chart";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { TrendLineChart } from "@/components/dashboard/trend-line-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";

import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";

export default function ReportsPage() {
    const { t } = useTranslation();
    const { transactions, loading } = useTransactions(1000);
    const { categories } = useCategories();

    // Default to this month
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
    });

    // Filter transactions by date range
    const filteredTransactions = useMemo(() => {
        if (!dateRange?.from) return [];
        const start = startOfDay(dateRange.from);
        const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

        return transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return isWithinInterval(txDate, { start, end });
        });
    }, [transactions, dateRange]);

    // Calculate Stats
    const stats = useMemo(() => {
        let income = 0;
        let expense = 0;
        filteredTransactions.forEach(tx => {
            if (tx.type === 'income' || tx.type === 'debt') income += tx.amount;
            else if (tx.type === 'expense' || tx.type === 'loan') expense += tx.amount;
        });
        return { income, expense, net: income - expense };
    }, [filteredTransactions]);

    // Prepare Pie Data
    const pieData = useMemo(() => {
        const expenseMap: Record<string, number> = {};
        const colors = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#f43f5e"];

        filteredTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
            const catName = categories.find(c => c.id === tx.categoryId)?.name || t('category.unknown');
            expenseMap[catName] = (expenseMap[catName] || 0) + tx.amount;
        });

        // Filter out zero amounts and sort by amount desc
        return Object.entries(expenseMap)
            .map(([category, amount], index) => ({
                category,
                amount,
                fill: colors[index % colors.length],
            }))
            .filter(item => item.amount > 0)
            .sort((a, b) => b.amount - a.amount);
    }, [filteredTransactions, categories, t]);

    // Prepare Trend Data (Daily)
    const trendData = useMemo(() => {
        const dailyMap: Record<string, { income: number, expense: number, date: string }> = {};

        // Initialize aggregation map
        filteredTransactions.forEach(tx => {
            // Safe approach:
            const d = new Date(tx.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            if (!dailyMap[key]) dailyMap[key] = { income: 0, expense: 0, date: key };

            if (tx.type === 'income' || tx.type === 'debt') dailyMap[key].income += tx.amount;
            else if (tx.type === 'expense' || tx.type === 'loan') dailyMap[key].expense += tx.amount;
        });

        // Sort by date components to ensure correct order
        return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredTransactions]);

    // Prepare Category Breakdown Data (for Bar Chart)
    const breakdownData = useMemo(() => {
        return pieData; // { category, amount, fill }
    }, [pieData]);

    if (loading) return <div>{t('common.loading')}</div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">{t('report.title')}</h2>
                <DateRangePicker date={dateRange} setDate={setDateRange} />
            </div>

            <StatsCards income={stats.income} expense={stats.expense} net={stats.net} />

            <div className="grid gap-4 grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-8">
                    <TrendLineChart data={trendData} />
                </div>
                <div className="md:col-span-4 min-h-[300px]">
                    <ExpensePieChart data={pieData} />
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:col-span-12">
                <CategoryBreakdown data={breakdownData} />
            </div>
        </div>
    );
}
