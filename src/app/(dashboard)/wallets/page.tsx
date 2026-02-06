"use client";

import { WalletForm } from "@/components/forms/wallet-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWallets } from "@/hooks/use-wallets";
import { useUserProfile } from "@/hooks/use-user-profile";
import { updateUserProfile } from "@/services/user.service";
import { useAuth } from "@/components/providers/auth-provider";
import { Wallet } from "@/types";
import { Plus, Wallet as WalletIcon, Star } from "lucide-react";
import { useState } from "react";
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

    const handleEdit = (wallet: Wallet) => {
        setEditingWallet(wallet);
        setOpen(true);
    };

    const handleSetDefault = async (walletId: string) => {
        if (!user) return;
        try {
            await updateUserProfile(user.uid, { defaultWalletId: walletId });
            toast.success(t('Default wallet updated'));
        } catch (error: unknown) {
            console.error(error);
            toast.error(t('Failed to update default wallet'));
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
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('wallet.add')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {wallets.map((wallet) => (
                    <Card key={wallet.id} className="relative transition-all hover:shadow-md cursor-pointer" onClick={() => handleEdit(wallet)}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {wallet.name}
                            </CardTitle>
                            <WalletIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatVNCurrency(wallet.balance)} {wallet.currency}</div>
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
    );
}
