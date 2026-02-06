"use client";
import { useWallets } from "@/hooks/use-wallets";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatVNCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/forms/transaction-form";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { useState } from "react";

export default function DashboardPage() {
    const { t } = useTranslation();
    const { wallets } = useWallets();
    const [open, setOpen] = useState(false);

    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    // Note: Simple sum assumes same currency or ignores currency mix. 
    // Proper app should normalize currency. For MVP we create mixed sum or just show first currency logic.

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">{t('common.dashboard')}</h2>
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('wallet.totalBalance')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatVNCurrency(totalBalance)} VND
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('wallet.active')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {wallets.length}
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
