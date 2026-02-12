"use client";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useWallets } from "@/hooks/use-wallets";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useTranslation } from "react-i18next";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVNCurrency, formatVNDate } from "@/lib/format";
import { CategoryIcon } from "@/components/ui/category-icon";

export function RecentTransactions() {
    const { t } = useTranslation();
    const { profile } = useUserProfile();
    const limit = profile?.recentTransactionsLimit || 10;
    const { transactions, loading } = useTransactions(limit);
    const { categories } = useCategories();
    const { wallets } = useWallets();

    if (loading) return <div>{t('common.loading')}</div>;

    // Helper to get category
    const getCategory = (categoryId?: string) => {
        if (!categoryId) return undefined;
        return categories.find(c => c.id === categoryId);
    };

    // Helper to get category name
    const getCategoryName = (categoryId?: string) => {
        const category = getCategory(categoryId);
        return category?.name || t('category.unknown');
    };

    // Helper to get wallet name
    const getWalletName = (walletId: string) => {
        const wallet = wallets.find(w => w.id === walletId);
        return wallet?.name || t('wallet.unknown');
    };

    // Helper to get wallet currency
    const getWalletCurrency = (walletId: string) => {
        const wallet = wallets.find(w => w.id === walletId);
        return wallet?.currency || 'VND';
    };

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>{t('transaction.recent')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {transactions.map((transaction) => {
                        const isIncome = transaction.type === 'income';
                        const currency = getWalletCurrency(transaction.walletId);
                        const category = getCategory(transaction.categoryId);

                        return (
                            <div key={transaction.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                {/* Icon - Use category icon or fallback */}
                                <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${transaction.isTransfer
                                        ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                                        : isIncome
                                            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                                            : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                                        }`}
                                    style={category?.color ? {
                                        backgroundColor: category.color + '15',
                                        borderColor: category.color + '40'
                                    } : undefined}
                                >
                                    {transaction.isTransfer ? (
                                        <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    ) : category?.icon ? (
                                        <CategoryIcon
                                            iconName={category.icon}
                                            color={category.color || (isIncome ? '#22c55e' : '#ef4444')}
                                            className="h-5 w-5"
                                        />
                                    ) : isIncome ? (
                                        <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            {/* Note as main title (largest) */}
                                            <p className="text-base font-semibold leading-tight mb-1.5 truncate">
                                                {transaction.note || (
                                                    transaction.isTransfer
                                                        ? t('transaction.transfer')
                                                        : getCategoryName(transaction.categoryId)
                                                )}
                                            </p>
                                            {/* Date - Wallet - Category (smaller, below) */}
                                            <p className="text-xs text-muted-foreground">
                                                {formatVNDate(transaction.date)}
                                                {" • "}
                                                {getWalletName(transaction.walletId)}
                                                {transaction.isTransfer && transaction.toWalletId && (
                                                    <> → {getWalletName(transaction.toWalletId)}</>
                                                )}
                                                {!transaction.isTransfer && (
                                                    <>
                                                        {" • "}
                                                        {getCategoryName(transaction.categoryId)}
                                                    </>
                                                )}
                                            </p>
                                        </div>

                                        {/* Amount */}
                                        <div className={`text-sm font-bold whitespace-nowrap ${transaction.isTransfer
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : isIncome
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {!transaction.isTransfer && (isIncome ? "+" : "-")}
                                            {formatVNCurrency(transaction.amount)} {currency}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {transactions.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-8">{t('transaction.noRecent')}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
