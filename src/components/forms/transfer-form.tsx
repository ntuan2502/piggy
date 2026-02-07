"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallets } from "@/hooks/use-wallets";
import { useUserProfile } from "@/hooks/use-user-profile";
import { addTransfer } from "@/services/transaction.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { parseVNCurrency, formatVNCurrencyInput, formatVNCurrency } from "@/lib/format";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";

interface TransferFormData {
    fromWalletId: string;
    toWalletId: string;
    amount: string;
    date: Date;
    note: string;
}

interface TransferFormProps {
    onSuccess?: () => void;
}

export function TransferForm({ onSuccess }: TransferFormProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { wallets } = useWallets();
    const { profile } = useUserProfile();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<TransferFormData>({
        defaultValues: {
            date: new Date(),
            note: "",
        },
    });

    const fromWalletId = watch("fromWalletId");
    const toWalletId = watch("toWalletId");
    const selectedDate = watch("date");

    // Set default wallet
    useEffect(() => {
        if (profile?.defaultWalletId && !fromWalletId) {
            // Check if default wallet exists in available wallets
            const walletExists = wallets.some(w => w.id === profile.defaultWalletId);
            if (walletExists) {
                setValue("fromWalletId", profile.defaultWalletId);
            }
        }
    }, [profile, wallets, fromWalletId, setValue]);

    // Filter wallets for "To" selector (exclude selected "From" wallet)
    const availableToWallets = wallets.filter((w) => w.id !== fromWalletId);

    // Filter wallets for "From" selector (exclude selected "To" wallet)
    const availableFromWallets = wallets.filter((w) => w.id !== toWalletId);

    const onSubmit = async (data: TransferFormData) => {
        if (!user) return;

        if (data.fromWalletId === data.toWalletId) {
            toast.error(t('validation.sameWalletTransfer'));
            return;
        }

        const amount = parseVNCurrency(data.amount);
        if (amount <= 0) {
            toast.error(t('validation.amountGreaterThanZero'));
            return;
        }

        setIsSubmitting(true);
        try {
            await addTransfer(
                user.uid,
                data.fromWalletId,
                data.toWalletId,
                amount,
                data.date,
                data.note || undefined
            );

            toast.success(t("transaction.transferSuccess"));
            onSuccess?.();
        } catch (error) {
            console.error("Transfer failed:", error);
            toast.error(t('validation.transferFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* From Wallet */}
            <div className="space-y-2">
                <Label htmlFor="fromWallet">{t("transaction.fromWallet")}</Label>
                <Select
                    value={fromWalletId}
                    onValueChange={(value) => setValue("fromWalletId", value)}
                >
                    <SelectTrigger id="fromWallet" className="w-full">
                        <SelectValue placeholder={t("wallet.select")} />
                    </SelectTrigger>
                    <SelectContent>
                        {availableFromWallets.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                                {wallet.name} ({formatVNCurrency(wallet.balance)} {wallet.currency})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.fromWalletId && (
                    <p className="text-sm text-red-500">{errors.fromWalletId.message}</p>
                )}
            </div>

            {/* Transfer Icon */}
            <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* To Wallet */}
            <div className="space-y-2">
                <Label htmlFor="toWallet">{t("transaction.toWallet")}</Label>
                <Select
                    value={toWalletId}
                    onValueChange={(value) => setValue("toWalletId", value)}
                >
                    <SelectTrigger id="toWallet" className="w-full">
                        <SelectValue placeholder={t("wallet.select")} />
                    </SelectTrigger>
                    <SelectContent>
                        {availableToWallets.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                                {wallet.name} ({formatVNCurrency(wallet.balance)} {wallet.currency})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.toWalletId && (
                    <p className="text-sm text-red-500">{errors.toWalletId.message}</p>
                )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
                <Label htmlFor="amount">{t("common.amount")}</Label>
                <Input
                    id="amount"
                    {...register("amount", { required: t('validation.amountRequired') })}
                    placeholder="0"
                    onChange={(e) => {
                        const formatted = formatVNCurrencyInput(e.target.value);
                        setValue("amount", formatted);
                    }}
                />
                {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                )}
            </div>

            {/* Date */}
            <div className="space-y-2">
                <Label>{t("common.date")}</Label>
                <DatePicker
                    value={selectedDate}
                    onChange={(date) => date && setValue("date", date)}
                    disableFuture={true}
                />
            </div>

            {/* Note */}
            <div className="space-y-2">
                <Label htmlFor="note">{t("common.note")} ({t("common.optional")})</Label>
                <Input
                    id="note"
                    {...register("note")}
                    placeholder={t("transaction.transferNote")}
                />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("common.loading") : t("transaction.transfer")}
            </Button>
        </form>
    );
}
