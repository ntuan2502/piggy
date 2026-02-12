"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft, Sparkles, Loader2, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryIcon } from "@/components/ui/category-icon";
import { DatePicker } from "@/components/ui/date-picker";

import { useAuth } from "@/components/providers/auth-provider";
import { useWallets } from "@/hooks/use-wallets";
import { useCategories } from "@/hooks/use-categories";
import { useUserProfile } from "@/hooks/use-user-profile";
import { addTransaction, updateTransaction } from "@/services/transaction.service";
import { formatVNCurrency, parseVNCurrency, formatVNCurrencyInput } from "@/lib/format";
import { TransactionType, Transaction } from "@/types";

const transactionSchema = z.object({
    amount: z.number().min(0.01, "Amount must be positive"),
    walletId: z.string().min(1, "Wallet is required"),
    categoryId: z.string().optional(),
    date: z.date(),
    note: z.string().optional(),
    tags: z.string().optional(), // We'll input as string and split
    type: z.enum(["income", "expense"]),
    excludeFromReport: z.boolean().optional(),
});

const DRAFT_KEY = "piggy_draft_transaction";

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
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Read draft SYNCHRONOUSLY before useForm — same pattern as edit mode
    const initialValues = (() => {
        if (transaction) {
            return {
                amount: transaction.amount,
                walletId: transaction.walletId,
                categoryId: transaction.categoryId,
                date: transaction.date,
                note: transaction.note || "",
                tags: transaction.tags?.join(", ") || "",
                type: (transaction.type === "income" || transaction.type === "expense") ? transaction.type : "expense" as const,
                excludeFromReport: transaction.excludeFromReport || false,
            };
        }

        // Try loading draft from localStorage for create mode
        if (mode === "create") {
            try {
                const savedDraft = localStorage.getItem(DRAFT_KEY);
                if (savedDraft) {
                    const parsed = JSON.parse(savedDraft);
                    return {
                        amount: parsed.amount || 0,
                        walletId: parsed.walletId || "",
                        categoryId: parsed.categoryId || "",
                        date: parsed.date ? new Date(parsed.date) : new Date(),
                        note: parsed.note || "",
                        tags: parsed.tags || "",
                        type: (parsed.type === "income" || parsed.type === "expense") ? parsed.type : "expense" as const,
                        excludeFromReport: parsed.excludeFromReport || false,
                    };
                }
            } catch (e) {
                console.error("Failed to load draft:", e);
            }
        }

        // Fallback defaults
        return {
            amount: 0,
            walletId: "",
            categoryId: "",
            date: new Date(),
            note: "",
            tags: "",
            type: "expense" as const,
            excludeFromReport: false,
        };
    })();

    const form = useForm<z.infer<typeof transactionSchema>>({
        resolver: zodResolver(transactionSchema),
        defaultValues: initialValues,
    });

    // Set default wallet
    const { setValue, watch } = form;
    const note = watch("note");
    const type = watch("type");

    // Cooldown timer effect
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    // Set default wallet (only if no walletId from draft or transaction)
    const walletId = watch("walletId");
    useEffect(() => {
        if (profile?.defaultWalletId && !walletId) {
            const walletExists = wallets.some(w => w.id === profile.defaultWalletId);
            if (walletExists) {
                setValue("walletId", profile.defaultWalletId);
            }
        }
    }, [profile, wallets, walletId, setValue]);

    // Sync form values when transaction prop changes
    useEffect(() => {
        if (transaction) {
            form.reset({
                amount: transaction.amount,
                walletId: transaction.walletId,
                categoryId: transaction.categoryId,
                date: transaction.date,
                note: transaction.note || "",
                tags: transaction.tags?.join(", ") || "",
                type: (transaction.type === "income" || transaction.type === "expense") ? transaction.type : "expense",
            });
        }
    }, [transaction, form]);

    // Auto-save draft with Debounce
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (mode === "create" && !transaction) {
            const subscription = form.watch((value) => {
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }

                saveTimeoutRef.current = setTimeout(() => {
                    localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
                }, 500);
            });

            return () => {
                subscription.unsubscribe();
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }
            };
        }
    }, [form, mode, transaction]);

    const handleAiSuggest = async () => {
        const note = form.getValues("note");
        const amount = form.getValues("amount");

        if (!note && !amount) return;

        setIsAiLoading(true);
        try {
            const response = await fetch('/api/ai/categorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    note,
                    amount,
                    // ONLY send categories that match the current mode (Income/Expense)
                    // This forces AI to pick a valid category for the selected type
                    categories: categories
                        .filter(c => c.type === type)
                        .map(c => ({ id: c.id, name: c.name, type: c.type })),
                    apiKey: profile?.geminiApiKey,
                    model: profile?.geminiModel
                })
            });

            const data = await response.json();
            if (data.categoryId) {
                // Check if category exists
                const cat = categories.find(c => c.id === data.categoryId);
                if (cat) {
                    // If category type differs from current type, switch type
                    if (cat.type !== type && (cat.type === "income" || cat.type === "expense")) {
                        form.setValue("type", cat.type);
                    }
                    form.setValue("categoryId", data.categoryId);
                }
            }
        } catch (error) {
            console.error("AI Suggestion Failed", error);
        } finally {
            setIsAiLoading(false);
            setCooldown(10); // Start 10s cooldown
        }
    };

    const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
        if (!user) return;
        setError(null);
        try {
            // Determine type: Use form type by default
            let type: TransactionType = values.type as TransactionType;
            if (values.categoryId) {
                const cat = categories.find(c => c.id === values.categoryId);
                if (cat) {
                    type = cat.type as TransactionType;
                }
            }

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
                    excludeFromReport: values.excludeFromReport || false,
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
                    excludeFromReport: values.excludeFromReport || false,
                });
            }

            form.reset();
            localStorage.removeItem(DRAFT_KEY); // Clear draft on success
            onSuccess();
        } catch (e) {
            console.error("Transaction failed:", e);
            setError("Failed to save transaction");
        }
    };

    return (
        <Form {...form}>
            <Tabs value={type} className="w-full" onValueChange={(val) => {
                form.setValue("type", val as "income" | "expense");
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
                        <span>{t('transaction.transferEditInfo')}</span>
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
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('wallet.select')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {wallets.map(w => (
                                            <SelectItem key={w.id} value={w.id}>{w.name} ({formatVNCurrency(w.balance)})</SelectItem>
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
                            // Filter categories by activeTab and sort by order
                            const filteredCategories = categories
                                .filter(c => c.type === type)
                                .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
                            const rootCategories = filteredCategories.filter(c => !c.parentId);
                            const getChildren = (parentId: string) =>
                                filteredCategories
                                    .filter(c => c.parentId === parentId)
                                    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

                            // Find selected category for display
                            const selectedCategory = categories.find(c => c.id === field.value);

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
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t('category.select')}>
                                                    {selectedCategory && (
                                                        <div className="flex items-center gap-2">
                                                            <CategoryIcon iconName={selectedCategory.icon} color={selectedCategory.color} />
                                                            <span>{selectedCategory.name}</span>
                                                        </div>
                                                    )}
                                                </SelectValue>
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
                                                                <div className="flex items-center gap-2">
                                                                    <CategoryIcon iconName={root.icon} color={root.color} />
                                                                    <span>{root.name}</span>
                                                                </div>
                                                            </SelectItem>
                                                            {getChildren(root.id).map(child => (
                                                                <SelectItem key={child.id} value={child.id} className="pl-6">
                                                                    <div className="flex items-center gap-2">
                                                                        <CategoryIcon iconName={child.icon} color={child.color} />
                                                                        <span className="text-muted-foreground">{child.name}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </div>
                                                    ))}
                                                    {rootCategories.length === 0 && (
                                                        <div className="p-2 text-sm text-center text-muted-foreground">
                                                            {t('transaction.noTransactions')}
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
                                        value={field.value > 0 ? formatVNCurrency(field.value, false) : ''}
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
                                <FormControl>
                                    <DatePicker
                                        value={field.value}
                                        onChange={field.onChange}
                                        disableFuture={true}
                                    />
                                </FormControl>
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
                                    <Input placeholder={t('transaction.tagsPlaceholder')} {...field} />
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
                                <FormLabel>{t('common.note')} ({t('common.optional')})</FormLabel>
                                <FormControl>
                                    <Textarea placeholder={t('transaction.notePlaceholder')} {...field} />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">{t('transaction.noteAiHint')}</p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* AI Smart Fill Trigger - Hide for transfers */}
                    {!transaction?.isTransfer && (
                        <div className="flex justify-end -mt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleAiSuggest}
                                disabled={isAiLoading || !note || cooldown > 0}
                                className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:opacity-50"
                            >
                                {isAiLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                {t('common.aiSmartFill')}
                                {cooldown > 0 && <span className="ml-1 text-[10px] opacity-70">({cooldown}s)</span>}
                            </Button>
                        </div>
                    )}

                    {/* Exclude from Report Toggle */}
                    <FormField
                        control={form.control}
                        name="excludeFromReport"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-sm font-medium cursor-pointer">{t('transaction.excludeFromReport')}</FormLabel>
                                        <p className="text-xs text-muted-foreground">{t('transaction.excludeFromReportHint')}</p>
                                    </div>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
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
