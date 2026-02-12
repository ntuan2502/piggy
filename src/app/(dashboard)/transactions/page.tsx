"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    Search,
    X,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Loader2,
    ListFilter,
    Calendar,
} from "lucide-react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfQuarter,
    endOfQuarter,
    startOfYear,
    endOfYear,
    addMonths,
    addYears,
    isToday,
    isYesterday,
    startOfDay,
    getQuarter,
    getYear,
    addQuarters,
} from "date-fns";
import { vi } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CategoryIcon } from "@/components/ui/category-icon";
import { TransactionForm } from "@/components/forms/transaction-form";
import { Separator } from "@/components/ui/separator";

import { useTransactions } from "@/hooks/use-transactions";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallets } from "@/hooks/use-wallets";
import { useCategories } from "@/hooks/use-categories";
import { useUserProfile } from "@/hooks/use-user-profile";
import { deleteTransaction, updateTransaction } from "@/services/transaction.service";
import { formatVNCurrency } from "@/lib/format";
import { Transaction } from "@/types";
import { cn } from "@/lib/utils";

// Period type definition
type PeriodType = "month" | "quarter" | "year";

export default function TransactionsPage() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { transactions, loading } = useTransactions(2000);
    const { wallets } = useWallets();
    const { categories } = useCategories();
    const { profile } = useUserProfile();

    // UI State
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
    const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);

    // Filter State
    const [periodType, setPeriodType] = useState<PeriodType>("month");
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Enhanced filters
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [walletFilter, setWalletFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    // Locale helper
    const locale = i18n.language === "vi" ? vi : undefined;

    // --- Helper Functions ---

    // Get current period label
    const periodLabel = useMemo(() => {
        if (periodType === "month") {
            return format(selectedDate, "MM/yyyy");
        } else if (periodType === "quarter") {
            return `Q${getQuarter(selectedDate)}/${getYear(selectedDate)}`;
        } else {
            return format(selectedDate, "yyyy");
        }
    }, [periodType, selectedDate]);

    // Navigate period
    const navigatePeriod = (direction: 'next' | 'prev') => {
        const factor = direction === 'next' ? 1 : -1;
        if (periodType === "month") {
            setSelectedDate(prev => addMonths(prev, factor));
        } else if (periodType === "quarter") {
            setSelectedDate(prev => addQuarters(prev, factor));
        } else {
            setSelectedDate(prev => addYears(prev, factor));
        }
    };

    // Get Start/End of selected period
    const selectedPeriodRange = useMemo(() => {
        if (periodType === "month") {
            return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
        } else if (periodType === "quarter") {
            return { start: startOfQuarter(selectedDate), end: endOfQuarter(selectedDate) };
        } else {
            return { start: startOfYear(selectedDate), end: endOfYear(selectedDate) };
        }
    }, [periodType, selectedDate]);

    // --- Filter Logic ---

    // Identify uncategorized transactions
    const uncategorizedTransactions = useMemo(() => {
        const validCategoryIds = new Set(categories.map(c => c.id));
        return transactions.filter(t =>
            !t.isTransfer &&
            (!t.categoryId || t.categoryId === "" || !validCategoryIds.has(t.categoryId))
        );
    }, [transactions, categories]);

    // Handle Auto Categorize
    const handleAutoCategorize = async () => {
        if (uncategorizedTransactions.length === 0) return;

        setIsAutoCategorizing(true);
        let successCount = 0;
        const total = uncategorizedTransactions.length;
        // Gemini 2.5 Flash Lite limits: RPM=10, TPM=250K, RPD=20
        // Use large batches to minimize API calls and preserve daily quota (RPD)
        const BATCH_SIZE = 200;
        const DELAY_MS = 7000; // 7s delay between batches to respect 10 req/min

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            const chunks = [];
            for (let i = 0; i < total; i += BATCH_SIZE) {
                chunks.push(uncategorizedTransactions.slice(i, i + BATCH_SIZE));
            }

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];

                // Show progress
                toast.info(t('transaction.categorizingBatch', { current: i + 1, total: chunks.length }));

                const payload = {
                    transactions: chunk.map(tx => ({
                        id: tx.id,
                        note: tx.note || "",
                        amount: tx.amount,
                        type: tx.type
                    })),
                    categories: categories.map(c => ({ id: c.id, name: c.name, type: c.type })),
                    apiKey: profile?.geminiApiKey,
                    model: profile?.geminiModel
                };

                const response = await fetch('/api/ai/categorize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.results && Array.isArray(data.results)) {
                        await Promise.all(data.results.map(async (result: { categoryId?: string; id: string }) => {
                            if (result.categoryId) {
                                const cat = categories.find(c => c.id === result.categoryId);
                                const originalTx = chunk.find(tx => tx.id === result.id);

                                if (cat && originalTx) {
                                    if (cat.type !== originalTx.type) {
                                        console.warn(`AI mismatch ignored: Tx ${originalTx.type} -> Cat ${cat.type}`);
                                        return;
                                    }

                                    await updateTransaction(originalTx.id, user!.uid, {
                                        ...originalTx,
                                        categoryId: result.categoryId
                                    });
                                    successCount++;
                                }
                            }
                        }));
                    }
                }

                // Add delay if not the last chunk
                if (i < chunks.length - 1) {
                    await delay(DELAY_MS);
                }
            }

            toast.success(t('transaction.categorizeSuccess', { successCount, count: total }));
        } catch (error) {
            console.error("Auto categorize failed:", error);
            toast.error(t('transaction.categorizeFailed'));
        } finally {
            setIsAutoCategorizing(false);
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsEditDialogOpen(true);
    };

    const handleDeleteClick = (transactionId: string) => {
        setTransactionToDelete(transactionId);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!user || !transactionToDelete) return;

        try {
            await deleteTransaction(transactionToDelete, user.uid);
            toast.success(t('transaction.deleteSuccess'));
            setDeleteConfirmOpen(false);
            setTransactionToDelete(null);
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error(t('transaction.deleteFailed'));
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setTypeFilter("all");
        setWalletFilter("all");
        setCategoryFilter("all");
    };

    const hasActiveFilters = searchQuery || typeFilter !== "all" || walletFilter !== "all" || categoryFilter !== "all";

    const getWallet = useCallback((walletId?: string) => {
        return wallets.find(w => w.id === walletId);
    }, [wallets]);

    const getWalletName = useCallback((walletId?: string) => {
        const wallet = getWallet(walletId);
        return wallet?.name || walletId || "";
    }, [getWallet]);

    const getCategory = useCallback((categoryId?: string) => {
        return categories.find(c => c.id === categoryId);
    }, [categories]);

    const getCategoryName = useCallback((categoryId?: string) => {
        const category = getCategory(categoryId);
        return category?.name || categoryId || "";
    }, [getCategory]);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'income':
            case 'debt':
                return 'text-green-600 dark:text-green-400';
            case 'expense':
            case 'loan':
                return 'text-red-600 dark:text-red-400';
            default:
                return '';
        }
    };

    // Get root categories for filter dropdown
    const rootCategories = useMemo(() => {
        return categories
            .filter(c => !c.parentId)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    }, [categories]);

    // Filter transactions by selected period + other filters
    const filteredTransactions = useMemo(() => {
        const { start, end } = selectedPeriodRange;

        let filtered = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= start && tDate <= end;
        });

        filtered = filtered.filter(transaction => {
            if (typeFilter !== "all" && transaction.type !== typeFilter) return false;
            if (walletFilter !== "all" && transaction.walletId !== walletFilter) return false;

            if (categoryFilter !== "all") {
                const category = getCategory(transaction.categoryId);
                if (!category) return false;
                if (category.id !== categoryFilter && category.parentId !== categoryFilter) return false;
            }

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const categoryName = getCategoryName(transaction.categoryId).toLowerCase();
                const walletName = getWalletName(transaction.walletId).toLowerCase();
                const note = (transaction.note || "").toLowerCase();
                const amount = transaction.amount.toString();
                const tags = (transaction.tags || []).join(" ").toLowerCase();

                return (
                    categoryName.includes(query) ||
                    walletName.includes(query) ||
                    note.includes(query) ||
                    amount.includes(query) ||
                    tags.includes(query)
                );
            }

            return true;
        });

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, selectedPeriodRange, typeFilter, walletFilter, categoryFilter, searchQuery, getCategoryName, getWalletName, getCategory]);

    // Group transactions based on period type
    const groupedTransactions = useMemo(() => {
        const groups: { key: string; label: string; subLabel?: string; transactions: Transaction[]; total: number }[] = [];

        filteredTransactions.forEach(tx => {
            const txDate = new Date(tx.date);
            let groupKey: string;
            let groupLabel: string;
            let subLabel: string | undefined;

            if (periodType === "month") {
                // Group by day
                groupKey = startOfDay(txDate).toISOString();
                groupLabel = format(txDate, "dd");
                const dayLabel = isToday(txDate)
                    ? t("common.today")
                    : isYesterday(txDate)
                        ? t("common.yesterday")
                        : format(txDate, "EEEE", { locale });
                subLabel = dayLabel;
            } else {
                // Quarter/Year: group by month
                groupKey = format(txDate, "yyyy-MM");
                groupLabel = format(txDate, "MMMM", { locale });
                subLabel = format(txDate, "yyyy");
            }

            let group = groups.find(g => g.key === groupKey);

            if (!group) {
                group = { key: groupKey, label: groupLabel, subLabel, transactions: [], total: 0 };
                groups.push(group);
            }

            group.transactions.push(tx);

            const isPositive = tx.type === "income" || tx.type === "debt";
            group.total += isPositive ? tx.amount : -tx.amount;
        });

        return groups;
    }, [filteredTransactions, periodType, locale, t]);

    // Calculate period totals
    const periodStats = useMemo(() => {
        let income = 0;
        let expense = 0;

        filteredTransactions.forEach(tx => {
            if (tx.type === "income") income += tx.amount;
            if (tx.type === "expense") expense += tx.amount;
        });

        return { income, expense, total: income - expense };
    }, [filteredTransactions]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-4">
            {/* --- Main Toolbar --- */}
            <div className="sticky top-0 bg-background/95 backdrop-blur z-20 py-2 -mx-4 px-4 border-b space-y-3 xl:space-y-0 xl:flex xl:items-center xl:justify-between">

                {/* --- MOBILE LAYOUT (3 Rows) --- */}
                <div className="xl:hidden flex flex-col gap-2">
                    {/* Row 1: Time Picker (Left) + Auto Categorize (Right) */}
                    <div className="flex items-center justify-between">
                        {/* Time Selector */}
                        <div className="flex items-center rounded-md border bg-card shadow-sm shrink-0 h-8">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none border-r" onClick={() => navigatePeriod('prev')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 px-2 min-w-[90px] font-medium rounded-none text-xs">
                                        <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                        {periodLabel}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3" align="start">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                                            {(["month", "quarter", "year"] as PeriodType[]).map((type) => (
                                                <Button
                                                    key={type}
                                                    variant={periodType === type ? "default" : "ghost"}
                                                    size="sm"
                                                    onClick={() => { setPeriodType(type); setSelectedDate(new Date()); }}
                                                    className="h-7 flex-1 text-xs"
                                                >
                                                    {type === "month" ? t("common.month") : type === "quarter" ? t("common.quarter") : t("common.year")}
                                                </Button>
                                            ))}
                                        </div>
                                        <div className="text-center text-sm text-muted-foreground pt-2 border-t">
                                            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setSelectedDate(new Date())}>
                                                {t("common.today")}
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none border-l" onClick={() => navigatePeriod('next')}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Auto Categorize Button */}
                        {uncategorizedTransactions.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAutoCategorize}
                                disabled={isAutoCategorizing}
                                className="h-8 px-2 text-xs gap-1"
                            >
                                {isAutoCategorizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-purple-500" />}
                                <span>{t('common.autoCategorize')} ({uncategorizedTransactions.length})</span>
                            </Button>
                        )}
                    </div>

                    {/* Row 2: Search Input (Full Width) */}
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder={t("transaction.searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 pl-8 text-sm w-full bg-background"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => setSearchQuery("")}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    {/* Row 3: Filter Selects (Scrollable) */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 mask-linear-fade">
                        {/* Quick Filters */}
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="h-8 w-[100px] text-xs shrink-0">
                                <SelectValue placeholder={t("transaction.item")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("transaction.all")}</SelectItem>
                                <SelectItem value="income">{t("transaction.income")}</SelectItem>
                                <SelectItem value="expense">{t("transaction.expense")}</SelectItem>
                                <SelectItem value="debt">{t("transaction.debt")}</SelectItem>
                                <SelectItem value="loan">{t("transaction.loan")}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={walletFilter} onValueChange={setWalletFilter}>
                            <SelectTrigger className="h-8 w-[100px] text-xs shrink-0">
                                <SelectValue placeholder={t("wallet.title")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("transaction.all")}</SelectItem>
                                {wallets.map(wallet => (
                                    <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="h-8 w-[120px] text-xs shrink-0">
                                <SelectValue placeholder={t("category.title")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("transaction.all")}</SelectItem>
                                {rootCategories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        <div className="flex items-center gap-2">
                                            <CategoryIcon iconName={cat.icon} color={cat.color} />
                                            <span>{cat.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {hasActiveFilters && (
                            <Button variant="ghost" size="icon" onClick={clearFilters} className="h-8 w-8 text-destructive shrink-0">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>


                {/* --- DESKTOP LAYOUT (Flex Row) --- */}
                <div className="hidden xl:flex items-center justify-between w-full">

                    {/* Left: Time & Filters */}
                    <div className="flex items-center gap-3">
                        {/* Time Selector */}
                        <div className="flex items-center rounded-md border bg-card shadow-sm shrink-0 h-9">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-r-none border-r" onClick={() => navigatePeriod('prev')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-9 px-3 min-w-[120px] font-medium rounded-none text-sm">
                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {periodLabel}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3" align="start">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                                            {(["month", "quarter", "year"] as PeriodType[]).map((type) => (
                                                <Button
                                                    key={type}
                                                    variant={periodType === type ? "default" : "ghost"}
                                                    size="sm"
                                                    onClick={() => { setPeriodType(type); setSelectedDate(new Date()); }}
                                                    className="h-7 flex-1 text-xs"
                                                >
                                                    {type === "month" ? t("common.month") : type === "quarter" ? t("common.quarter") : t("common.year")}
                                                </Button>
                                            ))}
                                        </div>
                                        <div className="text-center text-sm text-muted-foreground pt-2 border-t">
                                            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setSelectedDate(new Date())}>
                                                {t("common.today")}
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-l-none border-l" onClick={() => navigatePeriod('next')}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <Separator orientation="vertical" className="h-6 shrink-0" />

                        <div className="flex items-center gap-2">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="h-9 w-[120px] text-sm">
                                    <SelectValue placeholder={t("transaction.item")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("transaction.all")}</SelectItem>
                                    <SelectItem value="income">{t("transaction.income")}</SelectItem>
                                    <SelectItem value="expense">{t("transaction.expense")}</SelectItem>
                                    <SelectItem value="debt">{t("transaction.debt")}</SelectItem>
                                    <SelectItem value="loan">{t("transaction.loan")}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={walletFilter} onValueChange={setWalletFilter}>
                                <SelectTrigger className="h-9 w-[120px] text-sm">
                                    <SelectValue placeholder={t("wallet.title")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("transaction.all")}</SelectItem>
                                    {wallets.map(wallet => (
                                        <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="h-9 w-[140px] text-sm">
                                    <SelectValue placeholder={t("category.title")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("transaction.all")}</SelectItem>
                                    {rootCategories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            <div className="flex items-center gap-2">
                                                <CategoryIcon iconName={cat.icon} color={cat.color} />
                                                <span>{cat.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {hasActiveFilters && (
                                <Button variant="ghost" size="icon" onClick={clearFilters} className="h-9 w-9 text-destructive shrink-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {uncategorizedTransactions.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAutoCategorize}
                                disabled={isAutoCategorizing}
                                className="h-9 text-sm gap-2"
                            >
                                {isAutoCategorizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-purple-500" />}
                                <span>{t('common.autoCategorize')} ({uncategorizedTransactions.length})</span>
                            </Button>
                        )}

                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("transaction.searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 pl-9 text-sm w-full bg-background"
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Summary Bar --- */}
            {filteredTransactions.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg bg-muted/40 p-3 text-sm border gap-2">
                    <span className="text-muted-foreground text-xs sm:text-sm">{filteredTransactions.length} {t("transaction.item")}</span>
                    <div className="flex items-center gap-3 md:gap-4 text-xs sm:text-sm whitespace-nowrap overflow-x-auto w-full sm:w-auto">
                        <span className="text-green-600 font-medium">+{formatVNCurrency(periodStats.income)}</span>
                        <span className="text-red-600 font-medium">-{formatVNCurrency(periodStats.expense)}</span>
                        <span className={cn("font-bold ml-auto sm:ml-2", periodStats.total >= 0 ? "text-primary" : "text-destructive")}>
                            {periodStats.total > 0 ? "+" : ""}{formatVNCurrency(periodStats.total)}
                        </span>
                    </div>
                </div>
            )}

            {/* --- Transaction List --- */}
            {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                    <div className="bg-muted rounded-full p-4 mb-2">
                        <ListFilter className="h-8 w-8 opacity-50" />
                    </div>
                    <p>{hasActiveFilters ? t("transaction.noTransactions") : t("transaction.noRecent")}</p>
                    {hasActiveFilters && (
                        <Button variant="link" onClick={clearFilters}>{t("common.cancel")}</Button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {groupedTransactions.map((group) => (
                        <div key={group.key} className="rounded-lg border bg-card shadow-sm overflow-hidden">
                            {/* Group Header */}
                            <div className="bg-muted/50 px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between border-b">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-base sm:text-lg font-bold capitalize tabular-nums tracking-tight">{group.label}</span>
                                    {group.subLabel && (
                                        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider bg-background px-1.5 py-0.5 rounded border">{group.subLabel}</span>
                                    )}
                                </div>
                                <span className={cn("text-xs sm:text-sm font-semibold tabular-nums", group.total > 0 ? "text-green-600" : "text-red-600")}>
                                    {group.total > 0 ? "+" : ""}{formatVNCurrency(group.total)}
                                </span>
                            </div>

                            {/* Transactions */}
                            <div className="divide-y divide-border/50">
                                {group.transactions.map((transaction) => {
                                    const category = getCategory(transaction.categoryId);
                                    const isIncome = transaction.type === "income" || transaction.type === "debt";

                                    return (
                                        <div
                                            key={transaction.id}
                                            className="px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer group"
                                            onClick={() => handleEdit(transaction)}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex items-center justify-center size-8 sm:size-9 rounded-full shrink-0 bg-background border shadow-xs">
                                                    {category?.icon ? (
                                                        <CategoryIcon iconName={category.icon} color={category.color} className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-muted-foreground">{category?.name?.[0] || "?"}</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex flex-col gap-0.5">
                                                    <span className="text-sm font-medium truncate leading-none">{category?.name || t("category.unknown")}</span>
                                                    {transaction.note && (
                                                        <span className="text-xs text-muted-foreground truncate leading-none">{transaction.note}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className={cn(
                                                    "text-sm font-semibold tabular-nums leading-none",
                                                    getTypeColor(transaction.type)
                                                )}>
                                                    {isIncome ? "+" : "-"}
                                                    {formatVNCurrency(transaction.amount)}
                                                </span>
                                                <div className="h-4 flex items-center">
                                                    {/* Mobile: Always hide delete unless swiped (future). Desktop: Hover */}
                                                    <div className="hidden sm:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <button
                                                            className="text-[10px] font-medium text-destructive hover:underline uppercase tracking-wide"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteClick(transaction.id);
                                                            }}
                                                        >
                                                            {t("common.delete")}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Dialogs */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t("transaction.edit")}</DialogTitle>
                        <div className="hidden" id="edit-desc">{t("transaction.editDescription")}</div>
                    </DialogHeader>
                    <DialogDescription className="hidden">{t("transaction.edit")}</DialogDescription>
                    {editingTransaction && (
                        <TransactionForm
                            transaction={editingTransaction}
                            mode="edit"
                            onSuccess={() => {
                                setIsEditDialogOpen(false);
                                setEditingTransaction(null);
                                toast.success(t("transaction.updateSuccess"));
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("transaction.delete")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("transaction.confirmDelete")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">
                            {t("common.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
