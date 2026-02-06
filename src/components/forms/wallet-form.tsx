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

const walletSchema = z.object({
    name: z.string().min(1, "Name is required"),
    balance: z.number(),
    currency: z.enum(["VND", "USD"]),
});

interface WalletFormProps {
    onSuccess: () => void;
    wallet?: Wallet;
    mode?: "create" | "edit";
}

export function WalletForm({ onSuccess, wallet, mode = "create" }: WalletFormProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const form = useForm<z.infer<typeof walletSchema>>({
        resolver: zodResolver(walletSchema),
        defaultValues: wallet ? {
            name: wallet.name,
            balance: wallet.balance,
            currency: wallet.currency,
        } : {
            name: "",
            balance: 0,
            currency: "VND",
        },
    });

    const onSubmit = async (values: z.infer<typeof walletSchema>) => {
        if (!user) return;
        setError(null);
        try {
            if (mode === "edit" && wallet) {
                // Update existing wallet
                await updateWallet(wallet.id, {
                    name: values.name,
                    balance: values.balance,
                    currency: values.currency,
                });
                toast.success(t('wallet.updateSuccess') || 'Wallet updated successfully');
            } else {
                // Create new wallet
                await addWallet(user.uid, {
                    name: values.name,
                    balance: values.balance,
                    currency: values.currency,
                    icon: "wallet",
                    color: "#000000",
                });
                toast.success(t('wallet.createSuccess') || 'Wallet created successfully');
            }
            form.reset();
            onSuccess();
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred");
            }
        }
    };

    const handleDelete = async () => {
        if (!wallet) return;
        try {
            await deleteWallet(wallet.id);
            toast.success(t('wallet.deleteSuccess') || 'Wallet deleted successfully');
            setDeleteConfirmOpen(false);
            onSuccess();
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error(t('wallet.deleteFailed') || 'Failed to delete wallet');
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
                <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('wallet.initialBalance')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    placeholder="1.000.000"
                                    value={field.value > 0 ? formatVNCurrency(field.value) : ''}
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
                <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('wallet.currency')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('wallet.select')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="VND">VND</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                        {mode === "edit" ? t('common.save') : t('wallet.create')}
                    </Button>

                    {mode === "edit" && wallet && (
                        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('wallet.delete')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('wallet.confirmDelete')}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-red-500 hover:bg-red-600"
                                    >
                                        {t('common.delete')}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </form>
        </Form>
    );
}
