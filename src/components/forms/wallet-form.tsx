"use client";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addWallet, updateWallet, deleteWallet } from "@/services/wallet.service";
import { useAuth } from "@/components/providers/auth-provider";
import { useState } from "react";
import { Wallet } from "@/types";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { formatVNCurrency, formatVNCurrencyInput, parseVNCurrency } from "@/lib/format";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface WalletFormProps {
    onSuccess: () => void;
    wallet?: Wallet;
    mode?: "create" | "edit";
}

export function WalletForm({ onSuccess, wallet, mode = "create" }: WalletFormProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const walletSchema = z.object({
        name: z.string().min(1, t('validation.nameRequired')),
        initialBalance: z.number(),
        balance: z.number(),
        currency: z.literal("VND"),
        type: z.enum(["available", "credit"]),
    });

    const form = useForm<z.infer<typeof walletSchema>>({
        resolver: zodResolver(walletSchema),
        defaultValues: wallet ? {
            name: wallet.name,
            initialBalance: wallet.initialBalance || 0,
            balance: wallet.balance,
            currency: "VND", // Force current wallets to VND edit mode compatibility
            type: wallet.type,
        } : {
            name: "",
            initialBalance: 0,
            balance: 0,
            currency: "VND",
            type: "available",
        },
    });

    const onSubmit = async (values: z.infer<typeof walletSchema>) => {
        if (!user) return;
        try {
            if (mode === "edit" && wallet) {
                await updateWallet(wallet.id, {
                    name: values.name,
                    initialBalance: values.initialBalance,
                    currency: values.currency,
                    type: values.type,
                });
                toast.success(t('wallet.updateSuccess'));
            } else {
                await addWallet(user.uid, {
                    name: values.name,
                    initialBalance: values.initialBalance,
                    balance: values.initialBalance, // Initially current balance = initialBalance
                    currency: values.currency,
                    type: values.type,
                    icon: "wallet",
                    color: "#000000",
                });
                toast.success(t('wallet.createSuccess'));
            }
            onSuccess();
        } catch (error) {
            console.error("Failed to save wallet:", error);
            toast.error(t('common.error'));
        }
    };

    const handleDelete = async () => {
        if (!wallet) return;
        setIsDeleting(true);
        try {
            await deleteWallet(wallet.id);
            toast.success(t('wallet.deleteSuccess'));
            onSuccess();
        } catch (error) {
            console.error("Failed to delete wallet:", error);
            toast.error(t('common.error'));
        } finally {
            setIsDeleting(false);
            setDeleteConfirmOpen(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('wallet.name')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('wallet.placeholderName')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="initialBalance"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('wallet.initialBalance')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="0"
                                        value={formatVNCurrency(field.value)}
                                        onChange={(e) => {
                                            const formatted = formatVNCurrencyInput(e.target.value);
                                            const numericValue = parseVNCurrency(formatted);
                                            field.onChange(numericValue);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {mode === "edit" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {t('wallet.currentBalance')}
                            </label>
                            <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                                {formatVNCurrency(form.getValues("balance"))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('wallet.type')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('wallet.selectType')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="available">{t('wallet.typeAvailable')}</SelectItem>
                                        <SelectItem value="credit">{t('wallet.typeCredit')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('wallet.currency')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('wallet.selectCurrency')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="VND">VND</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex gap-2 pt-4">
                    {mode === "edit" && (
                        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" className="flex-1">
                                    <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('wallet.delete')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('validation.confirmDeleteAction')}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-red-500 hover:bg-red-600"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? t('common.loading') : t('common.delete')}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? t('common.loading') : (mode === "edit" ? t('common.save') : t('wallet.create'))}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
