"use client";

import * as React from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useAuth } from "@/components/providers/auth-provider";
import { useTranslation } from "react-i18next";
import { formatVNCurrency, formatVNDate } from "@/lib/format";
import { deleteTransaction, updateTransaction } from "@/services/transaction.service";
import { toast } from "sonner";
import { Pencil, Trash2, Search, Filter, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { TransactionForm } from "@/components/forms/transaction-form";
import { Transaction } from "@/types";
import { useWallets } from "@/hooks/use-wallets";
import { useCategories } from "@/hooks/use-categories";
import { useUserProfile } from "@/hooks/use-user-profile";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Badge } from "@/components/ui/badge";

export default function TransactionsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { transactions, loading } = useTransactions(1000);
    const { wallets } = useWallets();
    const { categories } = useCategories();
    const { profile } = useUserProfile();
    const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [transactionToDelete, setTransactionToDelete] = React.useState<string | null>(null);
    const [isAutoCategorizing, setIsAutoCategorizing] = React.useState(false);

    // Identify uncategorized transactions (empty ID or ID not found in categories)
    const uncategorizedTransactions = React.useMemo(() => {
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
    const [searchQuery, setSearchQuery] = React.useState("");
    const [typeFilter, setTypeFilter] = React.useState<string>("all");
    const [walletFilter, setWalletFilter] = React.useState<string>("all");
    const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

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

    const getWallet = React.useCallback((walletId?: string) => {
        return wallets.find(w => w.id === walletId);
    }, [wallets]);

    const getWalletName = React.useCallback((walletId?: string) => {
        const wallet = getWallet(walletId);
        return wallet?.name || walletId || "";
    }, [getWallet]);

    const getCategory = React.useCallback((categoryId?: string) => {
        return categories.find(c => c.id === categoryId);
    }, [categories]);

    const getCategoryName = React.useCallback((categoryId?: string) => {
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

    const getTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (type) {
            case 'income':
            case 'debt':
                return 'default';
            case 'expense':
            case 'loan':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    // Get root categories for filter dropdown (sorted by order)
    const rootCategories = React.useMemo(() => {
        return categories
            .filter(c => !c.parentId)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    }, [categories]);

    // Filter and search logic
    const filteredTransactions = React.useMemo(() => {
        return transactions.filter(transaction => {
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
    }, [transactions, typeFilter, walletFilter, categoryFilter, searchQuery, getCategoryName, getWalletName, getCategory]);

    if (loading) {
        return <div>{t('common.loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{t('transaction.allTransactions')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {filteredTransactions.length} / {transactions.length} {t('transaction.item')}
                    </p>
                </div>
                {uncategorizedTransactions.length > 0 && (
                    <Button
                        onClick={handleAutoCategorize}
                        disabled={isAutoCategorizing}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {isAutoCategorizing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        {t('transaction.autoCategorize')} ({uncategorizedTransactions.length})
                    </Button>
                )}
            </div>

            {/* Search and Filter */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('transaction.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{t('transaction.filter')}:</span>
                            </div>

                            {/* Type Filter */}
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full sm:w-[140px]">
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

                            {/* Wallet Filter */}
                            <Select value={walletFilter} onValueChange={setWalletFilter}>
                                <SelectTrigger className="w-full sm:w-[160px]">
                                    <SelectValue placeholder={t('wallet.title')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('transaction.all')} {t('wallet.title')}</SelectItem>
                                    {wallets.map(wallet => (
                                        <SelectItem key={wallet.id} value={wallet.id}>
                                            {wallet.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Category Filter */}
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder={t('category.title')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('transaction.all')} {t('category.title')}</SelectItem>
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

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-muted-foreground"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    {t('common.cancel')}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Transactions Table */}
            {filteredTransactions.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12 text-muted-foreground">
                        {hasActiveFilters
                            ? t('transaction.noTransactions')
                            : t('transaction.noRecent')}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px] pl-6">{t('common.date')}</TableHead>
                                    <TableHead>{t('category.title')}</TableHead>
                                    <TableHead>{t('wallet.title')}</TableHead>
                                    <TableHead>{t('common.note')}</TableHead>
                                    <TableHead className="w-[100px]">{t('transaction.item')}</TableHead>
                                    <TableHead className="text-right w-[150px]">{t('common.amount')}</TableHead>
                                    <TableHead className="text-right w-[100px] pr-6">{t('common.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((transaction) => {
                                    const category = getCategory(transaction.categoryId);
                                    const wallet = getWallet(transaction.walletId);

                                    return (
                                        <TableRow key={transaction.id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium whitespace-nowrap pl-6">
                                                {formatVNDate(transaction.date)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {category && (
                                                        <CategoryIcon
                                                            iconName={category.icon}
                                                            color={category.color}
                                                        />
                                                    )}
                                                    <span>{category?.name || transaction.categoryId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {wallet?.name || transaction.walletId}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={transaction.note}>
                                                {transaction.note || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getTypeBadgeVariant(transaction.type)}>
                                                    {t(`transaction.${transaction.type}`)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-semibold whitespace-nowrap ${getTypeColor(transaction.type)}`}>
                                                {transaction.type === 'income' || transaction.type === 'debt' ? '+' : '-'}
                                                {formatVNCurrency(transaction.amount)}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleEdit(transaction)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                        onClick={() => handleDeleteClick(transaction.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('transaction.edit')}</DialogTitle>
                    </DialogHeader>
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
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
