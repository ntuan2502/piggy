"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { Transaction } from "@/types";
import { TRANSACTION_FETCH_LIMIT } from "@/lib/constants";

import { ExpensePieChart } from "@/components/dashboard/expense-pie-chart";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { TrendLineChart } from "@/components/dashboard/trend-line-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";

import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";

export default function ReportsPage() {
    const { t } = useTranslation();
    const { transactions, loading } = useTransactions(TRANSACTION_FETCH_LIMIT);
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
            if (tx.excludeFromReport) return false;
            const txDate = new Date(tx.date);
            return isWithinInterval(txDate, { start, end });
        });
    }, [transactions, dateRange]);

    // Calculate Stats
    const stats = useMemo(() => {
        let income = 0;
        let expense = 0;
        filteredTransactions.forEach(tx => {
            if (tx.type === 'income') income += tx.amount;
            else if (tx.type === 'expense') expense += tx.amount;
        });
        return { income, expense, net: income - expense };
    }, [filteredTransactions]);

    // Prepare Pie Data
    const pieData = useMemo(() => {
        const expenseMap: Record<string, { amount: number, transactions: Transaction[] }> = {};
        const colors = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#f43f5e"];

        filteredTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
            const catName = categories.find(c => c.id === tx.categoryId)?.name || t('category.unknown');

            if (!expenseMap[catName]) {
                expenseMap[catName] = { amount: 0, transactions: [] };
            }

            expenseMap[catName].amount += tx.amount;
            expenseMap[catName].transactions.push(tx);
        });

        // Filter out zero amounts and sort by amount desc
        return Object.entries(expenseMap)
            .map(([category, data], index) => ({
                category,
                amount: data.amount,
                fill: colors[index % colors.length],
                transactions: data.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            }))
            .filter(item => item.amount > 0)
            .sort((a, b) => b.amount - a.amount);
    }, [filteredTransactions, categories, t]);

    // Prepare Trend Data (Daily)
    const trendData = useMemo(() => {
        const dailyMap: Record<string, { income: number, expense: number, date: string, transactions: Transaction[] }> = {};

        // Initialize aggregation map
        filteredTransactions.forEach(tx => {
            // Safe approach:
            const d = new Date(tx.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            if (!dailyMap[key]) dailyMap[key] = { income: 0, expense: 0, date: key, transactions: [] };

            if (tx.type === 'income') dailyMap[key].income += tx.amount;
            else if (tx.type === 'expense') dailyMap[key].expense += tx.amount;

            dailyMap[key].transactions.push(tx);
        });

        // Sort by date components to ensure correct order
        return Object.values(dailyMap).map(day => ({
            ...day,
            transactions: day.transactions.sort((a, b) => b.amount - a.amount)
        })).sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredTransactions]);

    // Prepare Category Breakdown Data (for Bar Chart)
    const breakdownData = useMemo(() => {
        return pieData; // { category, amount, fill }
    }, [pieData]);

    if (loading) return <div>{t('common.loading')}</div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
                <DateRangePicker date={dateRange} setDate={setDateRange} />
            </div>

            <StatsCards income={stats.income} expense={stats.expense} net={stats.net} />

            {/* Row 2: Trend Chart (Full Width) */}
            <div className="grid gap-4 grid-cols-1">
                <TrendLineChart data={trendData} />
            </div>

            {/* Row 3: Split View (Pie + Breakdown) */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <ExpensePieChart data={pieData} />
                <CategoryBreakdown data={breakdownData} />
            </div>
        </div>
    );
}
