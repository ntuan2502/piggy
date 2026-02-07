"use client";
import { useWallets } from "@/hooks/use-wallets";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatVNCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRightLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/forms/transaction-form";
import { TransferForm } from "@/components/forms/transfer-form";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { useState } from "react";

export default function DashboardPage() {
    const { t } = useTranslation();
    const { wallets } = useWallets();
    const [open, setOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);

    const { availableTotal, creditTotal, netWorth } = wallets.reduce((acc, w) => {
        if (w.type === 'available') acc.availableTotal += w.balance;
        if (w.type === 'credit') acc.creditTotal += w.balance;
        acc.netWorth += w.balance;
        return acc;
    }, { availableTotal: 0, creditTotal: 0, netWorth: 0 });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">{t('common.dashboard')}</h2>
                <div className="flex gap-2">
                    <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <ArrowRightLeft className="mr-2 h-4 w-4" /> {t('transaction.transfer')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{t('transaction.transfer')}</DialogTitle>
                                <DialogDescription>{t('transaction.transferDescription')}</DialogDescription>
                            </DialogHeader>
                            <TransferForm onSuccess={() => setTransferOpen(false)} />
                        </DialogContent>
                    </Dialog>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> {t('transaction.add')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{t('transaction.add')}</DialogTitle>
                                <DialogDescription>{t('transaction.description')}</DialogDescription>
                            </DialogHeader>
                            <TransactionForm onSuccess={() => setOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('wallet.netWorth')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {formatVNCurrency(netWorth)} VND
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('wallet.availableTotal')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatVNCurrency(availableTotal)} VND
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('wallet.creditTotal')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {formatVNCurrency(creditTotal)} VND
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                <RecentTransactions />
                {/* Placeholder for future Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>{t('report.overview')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-center justify-center text-gray-400">
                            {t('report.comingSoon')}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
