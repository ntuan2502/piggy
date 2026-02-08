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
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('transaction.income')}</CardTitle>
                    <ArrowUpIcon className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatVNCurrency(income)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('transaction.expense')}</CardTitle>
                    <ArrowDownIcon className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatVNCurrency(expense)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('wallet.netWorth')}</CardTitle>
                    <Wallet className={cn("h-4 w-4", net >= 0 ? "text-blue-500" : "text-red-500")} />
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", net >= 0 ? "text-blue-600" : "text-red-600")}>
                        {formatVNCurrency(net)}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
