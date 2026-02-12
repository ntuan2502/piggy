"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVNCurrency } from "@/lib/format";
import { ArrowDownIcon, ArrowUpIcon, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function StatsCards({ income, expense, net, className }: { income: number, expense: number, net: number, className?: string }) {
    const { t } = useTranslation();

    return (
        <div className={cn("grid gap-4 grid-cols-1 md:grid-cols-3", className)}>
            {/* Income Card */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 overflow-hidden shadow-sm py-0 gap-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                    <CardTitle className="text-xs font-semibold uppercase text-green-700/70 dark:text-green-400/70">{t('transaction.income')}</CardTitle>
                    <div className="rounded-full bg-green-500/10 p-1">
                        <ArrowUpIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="text-lg font-bold text-green-700 dark:text-green-400">{formatVNCurrency(income)}</div>
                </CardContent>
            </Card>

            {/* Expense Card */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 overflow-hidden shadow-sm py-0 gap-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                    <CardTitle className="text-xs font-semibold uppercase text-red-700/70 dark:text-red-400/70">{t('transaction.expense')}</CardTitle>
                    <div className="rounded-full bg-red-500/10 p-1">
                        <ArrowDownIcon className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="text-lg font-bold text-red-700 dark:text-red-400">{formatVNCurrency(expense)}</div>
                </CardContent>
            </Card>

            {/* Net Worth Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 overflow-hidden shadow-sm py-0 gap-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                    <CardTitle className="text-xs font-semibold uppercase text-blue-700/70 dark:text-blue-400/70">{t('report.periodBalance')}</CardTitle>
                    <div className="rounded-full bg-blue-500/10 p-1">
                        <Wallet className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatVNCurrency(net)}</div>
                </CardContent>
            </Card>
        </div>
    );
}
