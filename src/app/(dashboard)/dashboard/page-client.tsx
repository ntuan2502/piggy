"use client";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { Plus, ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/forms/transaction-form";
import { TransferForm } from "@/components/forms/transfer-form";

// Dashboard Components
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ExpensePieChart } from "@/components/dashboard/expense-pie-chart";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { TrendLineChart } from "@/components/dashboard/trend-line-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";

// Hooks & Utils
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { Transaction } from "@/types";
import { TRANSACTION_FETCH_LIMIT } from "@/lib/constants";

export default function DashboardClient() {
    const { t } = useTranslation();
    const { transactions, loading } = useTransactions(TRANSACTION_FETCH_LIMIT);
    const { categories } = useCategories();

    // UI State
    const [openAdd, setOpenAdd] = useState(false);
    const [openTransfer, setOpenTransfer] = useState(false);

    // Date Range State (Default: This Month)
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
    });

    // --- Report Logic from reports/page-client.tsx ---

    // 1. Filter transactions by date range
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

    // 2. Calculate Stats (Income, Expense, Net)
    const stats = useMemo(() => {
        let income = 0;
        let expense = 0;
        filteredTransactions.forEach(tx => {
            if (tx.type === 'income') income += tx.amount;
            else if (tx.type === 'expense') expense += tx.amount;
        });
        return { income, expense, net: income - expense };
    }, [filteredTransactions]);

    // 3. Prepare Pie Data (Expense by Category)
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

    // 4. Prepare Trend Data (Daily)
    const trendData = useMemo(() => {
        const dailyMap: Record<string, { income: number, expense: number, date: string, transactions: Transaction[] }> = {};

        filteredTransactions.forEach(tx => {
            const d = new Date(tx.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            if (!dailyMap[key]) dailyMap[key] = { income: 0, expense: 0, date: key, transactions: [] };

            if (tx.type === 'income') dailyMap[key].income += tx.amount;
            else if (tx.type === 'expense') dailyMap[key].expense += tx.amount;

            dailyMap[key].transactions.push(tx);
        });

        return Object.values(dailyMap).map(day => ({
            ...day,
            transactions: day.transactions.sort((a, b) => b.amount - a.amount)
        })).sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredTransactions]);

    // 5. Breakdown Data
    const breakdownData = useMemo(() => pieData, [pieData]);

    if (loading) return <div>{t('common.loading')}</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header: Actions + DatePicker */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="w-full md:w-auto">
                    <DateRangePicker date={dateRange} setDate={setDateRange} className="w-full md:w-[260px]" />
                </div>

                <div className="flex flex-row gap-2 w-full md:w-auto">
                    {/* Transfer Button */}
                    <Dialog open={openTransfer} onOpenChange={setOpenTransfer}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 md:w-auto md:flex-none">
                                <ArrowRightLeft className="mr-2 h-4 w-4" /> {t('transaction.transfer')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{t('transaction.transfer')}</DialogTitle>
                                <DialogDescription>{t('transaction.transferDescription')}</DialogDescription>
                            </DialogHeader>
                            <TransferForm onSuccess={() => setOpenTransfer(false)} />
                        </DialogContent>
                    </Dialog>

                    {/* Add Transaction Button */}
                    <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                        <DialogTrigger asChild>
                            <Button className="flex-1 md:w-auto md:flex-none">
                                <Plus className="mr-2 h-4 w-4" /> {t('transaction.add')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{t('transaction.add')}</DialogTitle>
                                <DialogDescription>{t('transaction.description')}</DialogDescription>
                            </DialogHeader>
                            <TransactionForm onSuccess={() => setOpenAdd(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Section 1: Stats Cards (Summary) */}
            <StatsCards income={stats.income} expense={stats.expense} net={stats.net} />

            <div className="grid gap-6 grid-cols-1 xl:grid-cols-7">
                {/* Section 2: Main Area (Trend + Recent) - Span 4/7 */}
                <div className="xl:col-span-4 space-y-6">
                    {/* Trend Chart */}
                    <TrendLineChart data={trendData} />

                    {/* Recent Transactions */}
                    <RecentTransactions />
                </div>

                {/* Section 3: Side Area (Pie + Breakdown) - Span 3/7 */}
                <div className="xl:col-span-3 space-y-6">
                    <ExpensePieChart data={pieData} />
                    <CategoryBreakdown data={breakdownData} />
                </div>
            </div>
        </div>
    );
}
