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
    ListFilter
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isToday, isYesterday, startOfDay } from "date-fns";
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
import { CategoryIcon } from "@/components/ui/category-icon";
import { TransactionForm } from "@/components/forms/transaction-form";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

import { useTransactions } from "@/hooks/use-transactions";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallets } from "@/hooks/use-wallets";
import { useCategories } from "@/hooks/use-categories";
import { useUserProfile } from "@/hooks/use-user-profile";
import { deleteTransaction, updateTransaction } from "@/services/transaction.service";
import { formatVNCurrency } from "@/lib/format";
import { Transaction } from "@/types";
import { cn } from "@/lib/utils";

export default function TransactionsPage() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { transactions, loading } = useTransactions(2000); // Fetch more to allow scrolling back
    const { wallets } = useWallets();
    const { categories } = useCategories();
    const { profile } = useUserProfile();
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
    const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Month Selection State
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    const handlePreviousMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
    const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

    // Identify uncategorized transactions (empty ID or ID not found in categories)
    const uncategorizedTransactions = useMemo(() => {
        const validCategoryIds = new Set(categories.map(c => c.id));
        return transactions.filter(t =>
            !t.isTransfer && // Exclude transfers
            (!t.categoryId || t.categoryId === "" || !validCategoryIds.has(t.categoryId))
        );
    }, [transactions, categories]);

    const handleAutoCategorize = async () => {
        if (uncategorizedTransactions.length === 0) return;

        setIsAutoCategorizing(true);
        let successCount = 0;
        const total = uncategorizedTransactions.length;
        const BATCH_SIZE = 20;

        toast.info(t('transaction.categorizingStarted', { count: total }));

        try {
            // Chunk transactions into batches
            const chunks = [];
            for (let i = 0; i < total; i += BATCH_SIZE) {
                chunks.push(uncategorizedTransactions.slice(i, i + BATCH_SIZE));
            }

            for (const chunk of chunks) {
                // Prepare batch payload
                const payload = {
                    transactions: chunk.map(tx => ({
                        id: tx.id,
                        note: tx.note || "",
                        amount: tx.amount,
                        type: tx.type // Send type to help AI (and for backend prompt)
                    })),
                    categories: categories.map(c => ({ id: c.id, name: c.name, type: c.type })),
                    apiKey: profile?.geminiApiKey
                };

                // Call AI API
                const response = await fetch('/api/ai/categorize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.results && Array.isArray(data.results)) {

                        // Process results for this chunk
                        await Promise.all(data.results.map(async (result: { categoryId?: string; id: string }) => {
                            if (result.categoryId) {
                                const cat = categories.find(c => c.id === result.categoryId);
                                const originalTx = chunk.find(tx => tx.id === result.id);

                                if (cat && originalTx) {
                                    // DOUBLE CHECK: Ensure the AI suggested category matches the transaction type
                                    if (cat.type !== originalTx.type) {
                                        console.warn(`AI mismatch ignored: Tx ${originalTx.type} -> Cat ${cat.type}`);
                                        return;
                                    }

                                    await updateTransaction(originalTx.id, user!.uid, {
                                        ...originalTx,
                                        categoryId: result.categoryId
                                        // type: cat.type // User requested to NOT change type
                                    });
                                    successCount++;
                                }
                            }
                        }));
                    }
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

    // Enhanced filters
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [walletFilter, setWalletFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

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

    // Get root categories for filter dropdown (sorted by order)
    const rootCategories = useMemo(() => {
        return categories
            .filter(c => !c.parentId)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    }, [categories]);

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        // 1. Filter by Date (Month)
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);

        let filtered = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= monthStart && tDate <= monthEnd;
        });

        // 2. Apply other filters
        filtered = filtered.filter(transaction => {
            // Type filter
            if (typeFilter !== "all" && transaction.type !== typeFilter) {
                return false;
            }

            // Wallet filter
            if (walletFilter !== "all" && transaction.walletId !== walletFilter) {
                return false;
            }

            // Category filter (including children of selected parent)
            if (categoryFilter !== "all") {
                const category = getCategory(transaction.categoryId);
                if (!category) return false;

                // Check if it's the selected category or a child of it
                if (category.id !== categoryFilter && category.parentId !== categoryFilter) {
                    return false;
                }
            }

            // Search filter
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

        // Sort by date desc
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, selectedMonth, typeFilter, walletFilter, categoryFilter, searchQuery, getCategoryName, getWalletName, getCategory]);

    // Group transactions by Date
    const groupedTransactions = useMemo(() => {
        const groups: { date: Date; transactions: Transaction[]; totalLogin: number }[] = [];

        filteredTransactions.forEach(tx => {
            const txDate = new Date(tx.date);
            // Normalize to start of day for comparison
            const dateKey = startOfDay(txDate).toISOString();

            let group = groups.find(g => g.date.toISOString() === dateKey);

            if (!group) {
                group = { date: startOfDay(txDate), transactions: [], totalLogin: 0 };
                groups.push(group);
            }

            group.transactions.push(tx);

            // Calculate daily total (Income - Expense)
            // Note: Debt/Loan logic might vary, assuming simple flow for now:
            // Income/Debt = +, Expense/Loan = -
            const isPositive = tx.type === 'income' || tx.type === 'debt';
            if (isPositive) {
                group.totalLogin += tx.amount;
            } else {
                group.totalLogin -= tx.amount;
            }
        });

        return groups; // Already sorted because transactions are sorted
    }, [filteredTransactions]);

    // Calculate Month Totals
    const monthStats = useMemo(() => {
        let income = 0;
        let expense = 0;

        filteredTransactions.forEach(tx => {
            if (tx.type === 'income') income += tx.amount;
            if (tx.type === 'expense') expense += tx.amount;
        });

        return { income, expense, total: income - expense };
    }, [filteredTransactions]);


    if (loading) {
        return <div>{t('common.loading')}</div>;
    }

    // Helper for date formatting
    const getDayLabel = (date: Date) => {
        if (isToday(date)) return t('common.today');
        if (isYesterday(date)) return t('common.yesterday');
        // Get day of week (Thứ 2, Thứ 3...)
        return format(date, 'EEEE', { locale: i18n.language === 'vi' ? vi : undefined });
    };

    // Helper to format "Tháng 2 2026"
    const formatMonthYear = (date: Date) => {
        return format(date, 'MMMM yyyy', { locale: i18n.language === 'vi' ? vi : undefined });
    };

    return (
        <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-end gap-1">
                    {uncategorizedTransactions.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAutoCategorize}
                            disabled={isAutoCategorizing}
                        >
                            {isAutoCategorizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            <span className="sr-only sm:not-sr-only sm:ml-2">Auto ({uncategorizedTransactions.length})</span>
                        </Button>
                    )}
                    <Button
                        variant={hasActiveFilters ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                        <ListFilter className="h-4 w-4" />
                    </Button>
                </div>

                {/* Month Navigator & Totals */}
                <div className="flex items-center justify-between rounded-lg border p-1">
                    <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex flex-col items-center">
                        <span className="text-sm font-medium capitalize">{formatMonthYear(selectedMonth)}</span>
                        <span className="text-xs font-semibold text-muted-foreground">
                            {monthStats.total > 0 ? "+" : ""}{formatVNCurrency(monthStats.total)}
                        </span>
                    </div>

                    <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Collapsible Filters */}
                <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <CollapsibleContent className="space-y-4 pt-2 pb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('transaction.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('transaction.item')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('transaction.all')}</SelectItem>
                                    <SelectItem value="income">{t('transaction.income')}</SelectItem>
                                    <SelectItem value="expense">{t('transaction.expense')}</SelectItem>
                                    <SelectItem value="debt">{t('transaction.debt')}</SelectItem>
                                    <SelectItem value="loan">{t('transaction.loan')}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={walletFilter} onValueChange={setWalletFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('wallet.title')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('transaction.all')}</SelectItem>
                                    {wallets.map(wallet => (
                                        <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('category.title')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('transaction.all')}</SelectItem>
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
                                <Button variant="outline" onClick={clearFilters} className="text-muted-foreground">
                                    <X className="h-4 w-4 mr-1" />
                                    {t('common.cancel')}
                                </Button>
                            )}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>


            {/* Transactions List */}
            {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    {hasActiveFilters || selectedMonth
                        ? t('transaction.noTransactions')
                        : t('transaction.noRecent')}
                </div>
            ) : (
                <div className="space-y-3">
                    {groupedTransactions.map((group) => (
                        <div key={group.date.toISOString()} className="rounded-lg border overflow-hidden">
                            {/* Date Header */}
                            <div className="bg-muted px-4 py-2 flex items-center justify-between">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold">{format(group.date, 'dd')}</span>
                                    <span className="text-sm text-muted-foreground">{getDayLabel(group.date)}</span>
                                </div>
                                <span className="text-sm font-semibold text-muted-foreground">
                                    {formatVNCurrency(group.totalLogin)}
                                </span>
                            </div>

                            {/* Transactions */}
                            <div className="divide-y">
                                {group.transactions.map((transaction) => {
                                    const category = getCategory(transaction.categoryId);
                                    const isIncome = transaction.type === 'income' || transaction.type === 'debt';

                                    return (
                                        <div
                                            key={transaction.id}
                                            className="px-4 py-3 flex items-center justify-between hover:bg-accent cursor-pointer group"
                                            onClick={() => handleEdit(transaction)}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex items-center justify-center size-9 rounded-full shrink-0 bg-muted">
                                                    {category?.icon ? (
                                                        <CategoryIcon iconName={category.icon} color={category.color} className="h-4 w-4" />
                                                    ) : (
                                                        <span className="text-xs font-semibold">{category?.name?.[0] || "?"}</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex flex-col">
                                                    <span className="text-sm font-medium truncate">{category?.name || t('category.unknown')}</span>
                                                    {transaction.note && (
                                                        <span className="text-xs text-muted-foreground truncate">{transaction.note}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <span className={cn(
                                                    "text-sm font-semibold",
                                                    getTypeColor(transaction.type)
                                                )}>
                                                    {isIncome ? '+' : '-'}
                                                    {formatVNCurrency(transaction.amount)}
                                                </span>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                                                    <button
                                                        className="text-xs text-destructive hover:underline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(transaction.id);
                                                        }}
                                                    >
                                                        {t('common.delete')}
                                                    </button>
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


            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('transaction.edit')}</DialogTitle>
                        <div className="hidden" id="edit-desc">{t('transaction.editDescription')}</div>
                    </DialogHeader>
                    <DialogDescription className="hidden">
                        {t('transaction.edit')}
                    </DialogDescription>
                    {editingTransaction && (
                        <TransactionForm
                            transaction={editingTransaction}
                            mode="edit"
                            onSuccess={() => {
                                setIsEditDialogOpen(false);
                                setEditingTransaction(null);
                                toast.success(t('transaction.updateSuccess'));
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('transaction.delete')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('transaction.confirmDelete')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            variant="destructive"
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
