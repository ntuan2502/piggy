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
            <Card className="border-none bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-100">{t('transaction.income')}</CardTitle>
                    <div className="rounded-full bg-white/20 p-2">
                        <ArrowUpIcon className="h-4 w-4 text-white" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatVNCurrency(income)}</div>
                    {/* <p className="text-xs text-emerald-100 mt-1 opacity-80">+12% {t('report.fromLastMonth')}</p> */}
                </CardContent>
            </Card>

            {/* Expense Card */}
            <Card className="border-none bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-100">{t('transaction.expense')}</CardTitle>
                    <div className="rounded-full bg-white/20 p-2">
                        <ArrowDownIcon className="h-4 w-4 text-white" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatVNCurrency(expense)}</div>
                    {/* <p className="text-xs text-red-100 mt-1 opacity-80">-4% {t('report.fromLastMonth')}</p> */}
                </CardContent>
            </Card>

            {/* Net Worth Card */}
            <Card className="border-none bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-100">{t('report.periodBalance')}</CardTitle>
                    <div className="rounded-full bg-white/20 p-2">
                        <Wallet className="h-4 w-4 text-white" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatVNCurrency(net)}</div>
                    <p className="text-xs text-blue-100 mt-1 opacity-80">{t('report.availableBalance')}</p>
                </CardContent>
            </Card>
        </div>
    );
}
