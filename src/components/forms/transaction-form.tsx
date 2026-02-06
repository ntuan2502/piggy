"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CalendarIcon, ArrowRightLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallets } from "@/hooks/use-wallets";
import { useCategories } from "@/hooks/use-categories";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useState, useEffect } from "react";
import { TransactionType, Transaction } from "@/types";
import { formatVNCurrency, parseVNCurrency, formatVNCurrencyInput, formatVNDate } from "@/lib/format";
import { addTransaction, updateTransaction } from "@/services/transaction.service";

const transactionSchema = z.object({
    amount: z.number().min(0.01, "Amount must be positive"),
    walletId: z.string().min(1, "Wallet is required"),
    categoryId: z.string().min(1, "Category is required"),
    date: z.date(),
    note: z.string().optional(),
    tags: z.string().optional(), // We'll input as string and split
});

export function TransactionForm({
    transaction,
    mode = "create",
    onSuccess
}: {
    transaction?: Transaction;
    mode?: "create" | "edit";
    onSuccess: () => void;
}) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { wallets } = useWallets();
    const { categories } = useCategories();
    const { profile } = useUserProfile();
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>(transaction?.type || "expense");

    // Find category type helper
    const getCategoryType = (catId: string): TransactionType => {
        const cat = categories.find(c => c.id === catId);
        // Ensure the type from category matches TransactionType, default to expense
        return (cat?.type as TransactionType) || 'expense';
    };

    const form = useForm<z.infer<typeof transactionSchema>>({
        resolver: zodResolver(transactionSchema),
        defaultValues: transaction ? {
            amount: transaction.amount,
            walletId: transaction.walletId,
            categoryId: transaction.categoryId,
            date: transaction.date,
            note: transaction.note || "",
            tags: transaction.tags?.join(", ") || "",
        } : {
            amount: 0,
            walletId: "",
            categoryId: "",
            date: new Date(),
            note: "",
            tags: "",
        },
    });

    // Set default wallet
    const { setValue, watch } = form; // Destructure for effect dependencies
    const walletId = watch("walletId");

    useEffect(() => {
        if (profile?.defaultWalletId && !walletId) {
            // Ensure the default wallet actually exists in the current list
            const walletExists = wallets.some(w => w.id === profile.defaultWalletId);
            if (walletExists) {
                setValue("walletId", profile.defaultWalletId);
            }
        }
    }, [profile, wallets, walletId, setValue]);

    const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
        if (!user) return;
        setError(null);
        try {
            const type = getCategoryType(values.categoryId);
            const tagsArray = values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [];

            if (mode === "edit" && transaction) {
                // Update existing transaction
                await updateTransaction(transaction.id, user.uid, {
                    amount: values.amount,
                    walletId: values.walletId,
                    categoryId: values.categoryId,
                    date: values.date,
                    note: values.note || "",
                    tags: tagsArray,
                    type,
                });
            } else {
                // Create new transaction
                await addTransaction(user.uid, {
                    amount: values.amount,
                    walletId: values.walletId,
                    categoryId: values.categoryId,
                    date: values.date,
                    note: values.note || "",
                    tags: tagsArray,
                    type,
                });
            }

            form.reset();
            onSuccess();
        } catch (e) {
            console.error("Transaction failed:", e);
            setError("Failed to save transaction");
        }
    };

    return (
        <Form {...form}>
            <Tabs defaultValue="expense" className="w-full" onValueChange={(val) => {
                setActiveTab(val);
                form.setValue("categoryId", "");
            }}>
                {!transaction?.isTransfer && (
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="expense">{t('transaction.expense')}</TabsTrigger>
                        <TabsTrigger value="income">{t('transaction.income')}</TabsTrigger>
                    </TabsList>
                )}

                {transaction?.isTransfer && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-4 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        <ArrowRightLeft className="h-4 w-4" />
                        <span>{t('transaction.transferEditInfo') || "Giao dịch chuyển khoản. Không được phép đổi ví hoặc danh mục."}</span>
                    </div>
                )}

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <TabsContent value="expense" className="mt-0">
                        {/* Hidden field to track type not needed if derived from category, but UI needs tab state */}
                    </TabsContent>
                    <TabsContent value="income" className="mt-0">
                    </TabsContent>

                    <FormField
                        control={form.control}
                        name="walletId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('wallet.title')}</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                    disabled={transaction?.isTransfer}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('wallet.select')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {wallets.map(w => (
                                            <SelectItem key={w.id} value={w.id}>{w.name} ({formatVNCurrency(w.balance)} {w.currency})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => {
                            // Filter categories by activeTab
                            const filteredCategories = categories.filter(c => c.type === activeTab);
                            const rootCategories = filteredCategories.filter(c => !c.parentId);
                            const getChildren = (parentId: string) => filteredCategories.filter(c => c.parentId === parentId);

                            return (
                                <FormItem>
                                    <FormLabel>{t('category.item')}</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                        disabled={transaction?.isTransfer}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('category.select')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {transaction?.isTransfer ? (
                                                <SelectItem value="transfer">{t('transaction.transfer')}</SelectItem>
                                            ) : (
                                                <>
                                                    {rootCategories.map(root => (
                                                        <div key={root.id}>
                                                            <SelectItem value={root.id} className="font-semibold">
                                                                {root.name}
                                                            </SelectItem>
                                                            {getChildren(root.id).map(child => (
                                                                <SelectItem key={child.id} value={child.id} className="pl-4 text-muted-foreground">
                                                                    ↳ {child.name}
                                                                </SelectItem>
                                                            ))}
                                                        </div>
                                                    ))}
                                                    {rootCategories.length === 0 && (
                                                        <div className="p-2 text-sm text-center text-muted-foreground">
                                                            {t('No categories found')}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )
                        }}
                    />

                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('common.amount')}</FormLabel>
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
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>{t('common.date')}</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    formatVNDate(field.value)
                                                ) : (
                                                    <span>{t('common.pickDate')}</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('common.tags')}</FormLabel>
                                <FormControl>
                                    <Input placeholder="travel, food, ..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('common.note')}</FormLabel>
                                <FormControl>
                                    <Textarea placeholder={t('common.note') + "..."} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button type="submit" className="w-full">
                        {mode === "edit" ? t('transaction.edit') : t('transaction.add')}
                    </Button>
                </form>
            </Tabs>
        </Form>
    );
}
