"use client";

import { WalletForm } from "@/components/forms/wallet-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWallets } from "@/hooks/use-wallets";
import { useUserProfile } from "@/hooks/use-user-profile";
import { updateUserProfile } from "@/services/user.service";
import { recalculateAllWalletBalances } from "@/services/wallet.service";
import { useAuth } from "@/components/providers/auth-provider";
import { Wallet } from "@/types";
import { Plus, Wallet as WalletIcon, Star, CreditCard, Banknote, RefreshCw, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatVNCurrency } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function WalletsPage() {
    const { wallets, loading } = useWallets();
    const { profile } = useUserProfile();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
    const [isRecalculating, setIsRecalculating] = useState(false);

    // Group wallets by type
    const { availableWallets, creditWallets, availableTotal, creditTotal, netWorth } = useMemo(() => {
        const available = wallets.filter(w => w.type === 'available');
        const credit = wallets.filter(w => w.type === 'credit');

        const availableSum = available.reduce((sum, w) => sum + w.balance, 0);
        const creditSum = credit.reduce((sum, w) => sum + w.balance, 0);
        const net = availableSum + creditSum; // Credit balances are negative

        return {
            availableWallets: available,
            creditWallets: credit,
            availableTotal: availableSum,
            creditTotal: creditSum,
            netWorth: net
        };
    }, [wallets]);

    const handleEdit = (wallet: Wallet) => {
        setEditingWallet(wallet);
        setOpen(true);
    };

    const handleSetDefault = async (walletId: string) => {
        if (!user) return;
        try {
            await updateUserProfile(user.uid, { defaultWalletId: walletId });
            toast.success(t('wallet.defaultUpdated'));
        } catch (error: unknown) {
            console.error(error);
            toast.error(t('wallet.defaultUpdateFailed'));
        }
    };

    const handleRecalculate = async () => {
        if (!user) return;
        setIsRecalculating(true);
        try {
            await recalculateAllWalletBalances(user.uid);
            toast.success(t('wallet.recalculateSuccess'));
        } catch (error) {
            console.error(error);
            toast.error(t('wallet.recalculateFailed'));
        } finally {
            setIsRecalculating(false);
        }
    };

    if (loading) return <div>{t('common.loading')}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t('wallet.title')}</h1>
                    <p className="text-muted-foreground">{t('wallet.description')}</p>
                </div>
                <Dialog open={open} onOpenChange={(val) => {
                    if (!val) setEditingWallet(null);
                    setOpen(val);
                }}>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleRecalculate}
                            disabled={isRecalculating}
                            title={t('wallet.recalculate')}
                        >
                            {isRecalculating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                            {t('wallet.recalculate')}
                        </Button>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                {t('wallet.add')}
                            </Button>
                        </DialogTrigger>
                    </div>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingWallet ? t('wallet.edit') : t('wallet.add')}</DialogTitle>
                            <DialogDescription>
                                {t('wallet.setDefaultHelp')}
                            </DialogDescription>
                        </DialogHeader>
                        <WalletForm
                            onSuccess={() => {
                                setOpen(false);
                                setEditingWallet(null);
                            }}
                            wallet={editingWallet || undefined}
                            mode={editingWallet ? "edit" : "create"}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Net Worth Summary */}
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardHeader>
                    <CardTitle className="text-lg">{t('wallet.netWorth')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{formatVNCurrency(netWorth)} VND</div>
                    <div className="mt-2 flex gap-4 text-sm opacity-90">
                        <div>
                            {t('wallet.availableTotal')}: {formatVNCurrency(availableTotal)}
                        </div>
                        <div>
                            {t('wallet.creditTotal')}: {formatVNCurrency(creditTotal)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Available Money Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h2 className="text-2xl font-semibold">{t('wallet.typeAvailable')}</h2>
                    <span className="text-muted-foreground">
                        ({formatVNCurrency(availableTotal)} VND)
                    </span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {availableWallets.map((wallet) => (
                        <Card
                            key={wallet.id}
                            className="relative transition-all hover:shadow-md cursor-pointer border-green-200 dark:border-green-900"
                            onClick={() => handleEdit(wallet)}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {wallet.name}
                                </CardTitle>
                                <WalletIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatVNCurrency(wallet.balance)} {wallet.currency}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t('wallet.totalBalance')}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("absolute top-2 right-2", profile?.defaultWalletId === wallet.id ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500")}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetDefault(wallet.id);
                                    }}
                                    title={t('wallet.default')}
                                >
                                    <Star className={cn("h-5 w-5", profile?.defaultWalletId === wallet.id && "fill-current")} />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Credit Accounts Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <h2 className="text-2xl font-semibold">{t('wallet.typeCredit')}</h2>
                    <span className="text-muted-foreground">
                        ({formatVNCurrency(creditTotal)} VND)
                    </span>
                </div>
                {creditWallets.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {creditWallets.map((wallet) => (
                            <Card
                                key={wallet.id}
                                className="relative transition-all hover:shadow-md cursor-pointer border-red-200 dark:border-red-900"
                                onClick={() => handleEdit(wallet)}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {wallet.name}
                                    </CardTitle>
                                    <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {formatVNCurrency(wallet.balance)} {wallet.currency}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t('wallet.totalBalance')}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
                            {t('wallet.noCreditAccounts')}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
