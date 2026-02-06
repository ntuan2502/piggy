"use client";
import { useTransactions } from "@/hooks/use-transactions";
import { useTranslation } from "react-i18next";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVNCurrency, formatVNDate } from "@/lib/format";

export function RecentTransactions() {
    const { t } = useTranslation();
    const { transactions, loading } = useTransactions();

    if (loading) return <div>{t('common.loading')}</div>;

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>{t('transaction.recent')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center">
                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800">
                                {/* TODO: Category Icon */}
                                {transaction.type === 'income' || transaction.type === 'loan' ? (
                                    <ArrowDownLeft className="h-4 w-4 text-green-500" />
                                ) : (
                                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                                )}
                            </div>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {/* Accessing category name would require joining or passing category map. For now simple. */}
                                    {t('transaction.item')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {formatVNDate(transaction.date)}
                                </p>
                            </div>
                            <div className={`ml-auto font-medium ${transaction.type === 'income' || transaction.type === 'loan' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.type === 'income' || transaction.type === 'loan' ? "+" : "-"}{formatVNCurrency(transaction.amount)}
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && (
                        <p className="text-gray-500 text-sm">{t('transaction.noRecent')}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
