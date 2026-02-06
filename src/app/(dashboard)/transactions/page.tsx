"use client";

import * as React from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useAuth } from "@/components/providers/auth-provider";
import { useTranslation } from "react-i18next";
import { formatVNCurrency, formatVNDate } from "@/lib/format";
import { deleteTransaction } from "@/services/transaction.service";
import { toast } from "sonner";
import { Pencil, Trash2, Search, Filter } from "lucide-react";
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

export default function TransactionsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { transactions, loading } = useTransactions();
    const { wallets } = useWallets();
    const { categories } = useCategories();
    const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [transactionToDelete, setTransactionToDelete] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [typeFilter, setTypeFilter] = React.useState<string>("all");

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
            toast.error("Failed to delete transaction");
        }
    };

    const getWalletName = React.useCallback((walletId: string) => {
        const wallet = wallets.find(w => w.id === walletId);
        return wallet?.name || walletId;
    }, [wallets]);

    const getCategoryName = React.useCallback((categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        return category?.name || categoryId;
    }, [categories]);

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

    // Filter and search logic
    const filteredTransactions = React.useMemo(() => {
        return transactions.filter(transaction => {
            // Type filter
            if (typeFilter !== "all" && transaction.type !== typeFilter) {
                return false;
            }

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const categoryName = getCategoryName(transaction.categoryId).toLowerCase();
                const walletName = getWalletName(transaction.walletId).toLowerCase();
                const note = (transaction.note || "").toLowerCase();
                const amount = transaction.amount.toString();

                return (
                    categoryName.includes(query) ||
                    walletName.includes(query) ||
                    note.includes(query) ||
                    amount.includes(query)
                );
            }

            return true;
        });
    }, [transactions, typeFilter, searchQuery, getCategoryName, getWalletName]);

    if (loading) {
        return <div>{t('common.loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t('transaction.allTransactions')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {filteredTransactions.length} / {transactions.length} {t('transaction.item')}
                    </p>
                </div>
            </div>

            {/* Search and Filter */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('transaction.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={t('transaction.filter')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('transaction.all')}</SelectItem>
                                    <SelectItem value="income">{t('transaction.income')}</SelectItem>
                                    <SelectItem value="expense">{t('transaction.expense')}</SelectItem>
                                    <SelectItem value="debt">{t('transaction.debt')}</SelectItem>
                                    <SelectItem value="loan">{t('transaction.loan')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Transactions Table */}
            {filteredTransactions.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12 text-muted-foreground">
                        {searchQuery || typeFilter !== "all"
                            ? "Không tìm thấy giao dịch phù hợp"
                            : t('transaction.noTransactions')}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">{t('common.date')}</TableHead>
                                <TableHead>{t('category.title')}</TableHead>
                                <TableHead>{t('wallet.title')}</TableHead>
                                <TableHead className="w-[100px]">{t('transaction.item')}</TableHead>
                                <TableHead className="text-right w-[150px]">{t('common.amount')}</TableHead>
                                <TableHead className="text-right w-[100px]">{t('common.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.map((transaction) => (
                                <TableRow key={transaction.id} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">{formatVNDate(transaction.date)}</TableCell>
                                    <TableCell>{getCategoryName(transaction.categoryId)}</TableCell>
                                    <TableCell className="text-muted-foreground">{getWalletName(transaction.walletId)}</TableCell>
                                    <TableCell>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeColor(transaction.type)}`}>
                                            {t(`transaction.${transaction.type}`)}
                                        </span>
                                    </TableCell>
                                    <TableCell className={`text-right font-semibold ${getTypeColor(transaction.type)}`}>
                                        {transaction.type === 'income' || transaction.type === 'debt' ? '+' : '-'}
                                        {formatVNCurrency(transaction.amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
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
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
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
