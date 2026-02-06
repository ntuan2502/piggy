"use client";
import { CategoryIcon } from "@/components/ui/category-icon";

import { useState } from "react";
import { useCategories } from "@/hooks/use-categories";
import { useAuth } from "@/components/providers/auth-provider";
import { addCategory, updateCategory, deleteCategory } from "@/services/category.service";
import { toast } from "sonner";
import { Category, TransactionType } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
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

export function CategoryManager() {
    const { categories } = useCategories();
    const { t } = useTranslation();
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [activeTab, setActiveTab] = useState("expense");

    // For Adding
    const [parentId, setParentId] = useState<string>("root");
    const { user } = useAuth();
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

    const filteredCategories = categories.filter(c => c.type === activeTab);
    const rootCategories = filteredCategories.filter(c => !c.parentId);

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setNewName(category.name);
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingCategory(null);
        setNewName("");
        setParentId("root");
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!user) return;
        try {
            if (editingCategory) {
                // Update
                await updateCategory(editingCategory.id, { name: newName });
            } else {
                // Add
                await addCategory({
                    userId: user.uid,
                    name: newName,
                    type: activeTab as TransactionType,
                    parentId: parentId === "root" ? undefined : parentId,
                    icon: "Circle",
                    color: "#6366f1"
                });
            }
            setIsDialogOpen(false);
            setNewName("");
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteClick = (id: string) => {
        setCategoryToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete || !user) return;

        try {
            await deleteCategory(categoryToDelete);
            toast.success(t('category.deleteSuccess') || 'Category deleted');
            setDeleteConfirmOpen(false);
            setCategoryToDelete(null);
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete category");
        }
    };

    return (
        <div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('category.management')}</CardTitle>
                    <Button size="sm" onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('category.add')}
                    </Button>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="expense" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="expense">{t('transaction.expense')}</TabsTrigger>
                            <TabsTrigger value="income">{t('transaction.income')}</TabsTrigger>
                        </TabsList>

                        <div className="space-y-4">
                            {rootCategories.map(root => (
                                <div key={root.id} className="border rounded-lg p-3">
                                    <div className="flex items-center justify-between font-medium">
                                        <div className="flex items-center gap-2">
                                            <CategoryIcon iconName={root.icon} color={root.color} />
                                            {root.name}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(root)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteClick(root.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    {/* Children */}
                                    <div className="ml-6 mt-2 space-y-2 border-l pl-4">
                                        {categories.filter(c => c.parentId === root.id).map(child => (
                                            <div key={child.id} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <CategoryIcon iconName={child.icon} color={child.color} />
                                                    <span>{child.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(child)}>
                                                        <Pencil className="w-3 h-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDeleteClick(child.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Tabs>
                </CardContent>
            </Card>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('category.confirmDelete')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone.
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? t('category.edit') : t('category.add')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                {t('common.name')}
                            </Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        {!editingCategory && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="parent" className="text-right">
                                    {t('category.parent')}
                                </Label>
                                <Select value={parentId} onValueChange={setParentId}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder={t('category.none')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="root">{t('category.none')}</SelectItem>
                                        {rootCategories.map(r => (
                                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleSave}>{t('common.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
