"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    Plus,
    Wallet as WalletIcon,
    Star,
    CreditCard,
    Banknote,
    RefreshCw,
    Loader2,
    GripVertical
} from "lucide-react";
import { toast } from "sonner";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { WalletForm } from "@/components/forms/wallet-form";

import { useWallets } from "@/hooks/use-wallets";
import { useUserProfile } from "@/hooks/use-user-profile";
import { updateUserProfile } from "@/services/user.service";
import { recalculateAllWalletBalances, reorderWallets } from "@/services/wallet.service";
import { useAuth } from "@/components/providers/auth-provider";
import { formatVNCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Wallet } from "@/types";

// Sortable Item Component
function SortableWalletCard({
    wallet,
    isDefault,
    onSetDefault,
    onClick
}: {
    wallet: Wallet,
    isDefault: boolean,
    onSetDefault: () => void,
    onClick: () => void
}) {
    const { t } = useTranslation();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: wallet.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
        touchAction: 'none'
    };

    const isCredit = wallet.type === 'credit';

    return (
        <div ref={setNodeRef} style={style} className={cn("group", isDragging ? "z-50" : "")}>
            <Card
                className={cn(
                    "relative transition-all hover:shadow-md cursor-pointer h-full overflow-hidden",
                    isDragging ? "opacity-50 shadow-xl scale-105 ring-2 ring-primary" : "",
                    isCredit ? "border-red-200 dark:border-red-900" : "border-green-200 dark:border-green-900",
                    isDefault ? "ring-2 ring-yellow-400 dark:ring-yellow-500 border-yellow-400 dark:border-yellow-500" : ""
                )}
                onClick={onClick}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2 pr-8">
                        {isDefault && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <CardTitle className="text-sm font-medium truncate">
                            {wallet.name}
                        </CardTitle>
                    </div>

                    <div className="flex items-center gap-1">
                        {!isDefault && !isCredit && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-yellow-500 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSetDefault();
                                }}
                                title={t('wallet.setDefault')}
                            >
                                <Star className="h-4 w-4" />
                            </Button>
                        )}

                        {isCredit ? (
                            <CreditCard className={cn("h-4 w-4", isDefault ? "text-yellow-600" : "text-red-600 dark:text-red-400")} />
                        ) : (
                            <WalletIcon className={cn("h-4 w-4", isDefault ? "text-yellow-600" : "text-green-600 dark:text-green-400")} />
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold truncate", isCredit ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400")}>
                        {formatVNCurrency(wallet.balance)} {wallet.currency}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('wallet.totalBalance')}
                    </p>

                    {/* Drag Handle - Valid target for drag listeners */}
                    <div
                        className="absolute top-0 right-0 p-3 text-muted-foreground opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-muted/50 rounded-bl-lg z-10"
                        {...attributes}
                        {...listeners}
                        onClick={(e) => {
                            e.stopPropagation(); // prevent card click
                        }}
                        title={t('common.dragToReorder')}
                    >
                        <GripVertical className="h-4 w-4" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}



export default function WalletsPage() {
    const { wallets, loading } = useWallets();
    const { profile } = useUserProfile();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
    const [isRecalculating, setIsRecalculating] = useState(false);

    // Group wallets by type
    const { availableWallets, creditWallets, availableTotal, creditLimitTotal, creditDebtTotal, netWorth, creditRemainingTotal } = useMemo(() => {
        const available = wallets.filter(w => w.type === 'available');
        const credit = wallets.filter(w => w.type === 'credit');

        const availableSum = available.reduce((sum, w) => sum + w.balance, 0);

        // For credit wallets in this app:
        // initialBalance = Credit Limit (Hạn mức)
        // balance = Available Credit (Hạn mức còn lại)
        // Debt = Credit Limit - Available Credit

        const limitSum = credit.reduce((sum, w) => sum + (w.initialBalance || 0), 0);
        const currentRefmainingSum = credit.reduce((sum, w) => sum + w.balance, 0);
        const debtSum = limitSum - currentRefmainingSum;

        // Net Worth = Assets - Debt
        // Assets = Available Money + (Credit Limit - Debt)? No.
        // Net Worth = Cash - Debt.
        const net = availableSum - debtSum;

        return {
            availableWallets: available,
            creditWallets: credit,
            availableTotal: availableSum,
            creditLimitTotal: limitSum, // Total Credit Limit
            creditRemainingTotal: currentRefmainingSum, // Total Remaining Credit
            creditDebtTotal: -debtSum, // Total Debt (displayed as negative)
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

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const activeWallet = wallets.find(w => w.id === active.id);
        const overWallet = wallets.find(w => w.id === over.id);

        if (!activeWallet || !overWallet || activeWallet.type !== overWallet.type) {
            return;
        }

        const isAvailableGroup = activeWallet.type === 'available';
        const currentList = isAvailableGroup ? availableWallets : creditWallets;

        const oldIndex = currentList.findIndex(w => w.id === active.id);
        const newIndex = currentList.findIndex(w => w.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedList = arrayMove(currentList, oldIndex, newIndex);

            const updates = reorderedList.map((w, index) => ({
                id: w.id,
                order: index + 1
            }));

            try {
                await reorderWallets(updates);
            } catch (error) {
                console.error("Failed to reorder wallets:", error);
                toast.error("Failed to save new order");
            }
        }
    };

    if (loading) return <div>{t('common.loading')}</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
                <div></div>
                <Dialog open={open} onOpenChange={(val) => {
                    if (!val) setEditingWallet(null);
                    setOpen(val);
                }}>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            onClick={handleRecalculate}
                            disabled={isRecalculating}
                            title={t('wallet.recalculate')}
                            className="flex-1 md:flex-none"
                        >
                            {isRecalculating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                            {t('wallet.recalculate')}
                        </Button>
                        <Button
                            className="flex-1 md:flex-none"
                            onClick={() => {
                                setEditingWallet(null);
                                setOpen(true);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('wallet.add')}
                        </Button>
                    </div>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingWallet ? t('wallet.edit') : t('wallet.add')}</DialogTitle>
                            <DialogDescription>
                                {editingWallet ? t('wallet.editHelp') : t('wallet.addHelp')}
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

            {/* Net Worth Summary Card */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg border-0 overflow-hidden relative">
                {/* Decorative circles */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

                <CardHeader className="pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-widest">{t('wallet.netWorth')}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        {formatVNCurrency(netWorth)} <span className="text-xl md:text-2xl font-normal opacity-70">VND</span>
                    </div>

                    {/* Stats Panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
                        {/* Panel 1: Available Money (Matches breadth of Assets) */}
                        <div className="lg:col-span-5 bg-black/10 rounded-xl p-4 border border-white/5 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 bg-green-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-green-500/30 transition-colors duration-500"></div>

                            <div className="flex items-center gap-2 text-sm uppercase tracking-wider opacity-90 font-medium mb-2 relative z-10">
                                <div className="p-1.5 bg-green-500/20 rounded-md">
                                    <Banknote className="w-4 h-4 text-green-100" />
                                </div>
                                {t('wallet.availableTotal')}
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold relative z-10">{formatVNCurrency(availableTotal)}</div>
                        </div>

                        {/* Panel 2: Credit Overview (Wider to accommodate 3 metrics) */}
                        <div className="lg:col-span-7 bg-black/10 rounded-xl p-4 border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 bg-red-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-red-500/30 transition-colors duration-500"></div>

                            <div className="flex items-center gap-2 text-sm uppercase tracking-wider opacity-90 font-medium mb-4 relative z-10">
                                <div className="p-1.5 bg-red-500/20 rounded-md">
                                    <CreditCard className="w-4 h-4 text-red-100" />
                                </div>
                                {t('wallet.creditCommon')}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                                <div>
                                    <div className="text-xs opacity-70 mb-1">{t('wallet.creditLimit')}</div>
                                    <div className="text-lg font-semibold">{formatVNCurrency(creditLimitTotal)}</div>
                                </div>
                                <div>
                                    <div className="text-xs opacity-70 mb-1">{t('wallet.creditRemaining')}</div>
                                    <div className="text-lg font-semibold">{formatVNCurrency(creditRemainingTotal)}</div>
                                </div>
                                <div>
                                    <div className="text-xs opacity-70 mb-1">{t('wallet.currentDebt')}</div>
                                    <div className="text-xl font-bold text-red-300">{formatVNCurrency(creditDebtTotal)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {/* Available Money Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h2 className="text-2xl font-semibold">{t('wallet.typeAvailable')}</h2>
                        <span className="text-muted-foreground">
                            ({formatVNCurrency(availableTotal)} VND)
                        </span>
                    </div>
                    {availableWallets.length > 0 ? (
                        <SortableContext
                            items={availableWallets.map(w => w.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {availableWallets.map((wallet) => (
                                    <SortableWalletCard
                                        key={wallet.id}
                                        wallet={wallet}
                                        isDefault={profile?.defaultWalletId === wallet.id}
                                        onSetDefault={() => handleSetDefault(wallet.id)}
                                        onClick={() => handleEdit(wallet)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    ) : (
                        <Card className="border-dashed">
                            <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
                                {t('wallet.noWallets')}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Credit Accounts Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <h2 className="text-2xl font-semibold">{t('wallet.typeCredit')}</h2>
                        <span className="text-muted-foreground">
                            ({formatVNCurrency(creditDebtTotal)} VND)
                        </span>
                    </div>
                    {creditWallets.length > 0 ? (
                        <SortableContext
                            items={creditWallets.map(w => w.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {creditWallets.map((wallet) => (
                                    <SortableWalletCard
                                        key={wallet.id}
                                        wallet={wallet}
                                        isDefault={profile?.defaultWalletId === wallet.id}
                                        onSetDefault={() => handleSetDefault(wallet.id)}
                                        onClick={() => handleEdit(wallet)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    ) : (
                        <Card className="border-dashed">
                            <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
                                {t('wallet.noCreditAccounts')}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DndContext>
        </div>
    );
}
