"use client";

import { useState } from "react";
import { useCategories } from "@/hooks/use-categories";
import { useAuth } from "@/components/providers/auth-provider";
import { addCategory, updateCategory, deleteCategory, resetCategories } from "@/services/category.service";
import { toast } from "sonner";
import { Category, TransactionType } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, Plus, GripVertical, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CategoryIcon } from "@/components/ui/category-icon";
import { IconPicker } from "@/components/ui/icon-picker";
import { ColorPicker } from "@/components/ui/color-picker";
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
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

// Sortable Category Item Component
function SortableCategoryItem({
    category,
    onEdit,
    onDelete,
    children,
    isParent = false,
}: {
    category: Category;
    onEdit: (cat: Category) => void;
    onDelete: (id: string) => void;
    children?: React.ReactNode;
    isParent?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: category.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                isParent ? "border rounded-lg p-3" : "flex items-center justify-between text-sm py-1",
                isDragging && "opacity-50 bg-accent"
            )}
        >
            <div className={cn("flex items-center justify-between", isParent && "font-medium")}>
                <div className="flex items-center gap-2">
                    <button
                        className="cursor-grab hover:bg-accent rounded p-1 touch-none"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className={cn("text-muted-foreground", isParent ? "w-4 h-4" : "w-3 h-3")} />
                    </button>
                    <CategoryIcon iconName={category.icon} color={category.color} />
                    <span>{category.name}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={isParent ? "" : "h-6 w-6"}
                        onClick={() => onEdit(category)}
                    >
                        <Pencil className={isParent ? "w-4 h-4" : "w-3 h-3"} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("text-red-500 hover:text-red-600", isParent ? "" : "h-6 w-6")}
                        onClick={() => onDelete(category.id)}
                    >
                        <Trash2 className={isParent ? "w-4 h-4" : "w-3 h-3"} />
                    </Button>
                </div>
            </div>
            {children}
        </div>
    );
}

export function CategoryManager() {
    const { categories } = useCategories();
    const { t } = useTranslation();
    const { user } = useAuth();

    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("Circle");
    const [selectedColor, setSelectedColor] = useState("#6366f1");
    const [parentId, setParentId] = useState<string>("root");
    const [activeTab, setActiveTab] = useState("expense");

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

    // Filtered and sorted categories
    const filteredCategories = categories.filter(c => c.type === activeTab);
    const rootCategories = filteredCategories
        .filter(c => !c.parentId)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    const getChildren = (parentId: string) =>
        filteredCategories
            .filter(c => c.parentId === parentId)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setNewName(category.name);
        setSelectedIcon(category.icon || "Circle");
        setSelectedColor(category.color || "#6366f1");
        setParentId(category.parentId || "root");
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingCategory(null);
        setNewName("");
        setSelectedIcon("Circle");
        setSelectedColor("#6366f1");
        setParentId("root");
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!user || !newName.trim()) return;
        try {
            if (editingCategory) {
                // Update existing
                await updateCategory(editingCategory.id, {
                    name: newName,
                    icon: selectedIcon,
                    color: selectedColor,
                    parentId: parentId === "root" ? null : parentId,
                });
            } else {
                // Calculate order for new category
                const siblings = parentId === "root"
                    ? rootCategories
                    : getChildren(parentId);
                const newOrder = siblings.length;

                // Add new
                await addCategory({
                    userId: user.uid,
                    name: newName,
                    type: activeTab as TransactionType,
                    parentId: parentId === "root" ? null : parentId,
                    icon: selectedIcon,
                    color: selectedColor,
                    order: newOrder,
                });
            }
            setIsDialogOpen(false);
            setNewName("");
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const handleDeleteClick = (id: string) => {
        setCategoryToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete || !user) return;
        try {
            await deleteCategory(categoryToDelete, user.uid);
            toast.success(t('category.deleteSuccess'));
            setDeleteConfirmOpen(false);
            setCategoryToDelete(null);
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error(t('category.deleteFailed'));
        }
    };

    const handleReset = async () => {
        if (!user) return;
        try {
            await resetCategories(user.uid);
            toast.success(t('category.resetSuccess'));
            setResetConfirmOpen(false);
        } catch (error) {
            console.error("Reset failed:", error);
            toast.error(t('common.error'));
        }
    };

    // Handle drag end for reordering
    const handleDragEnd = async (event: DragEndEvent, parentCatId: string | null) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const items = parentCatId ? getChildren(parentCatId) : rootCategories;
        const oldIndex = items.findIndex(c => c.id === active.id);
        const newIndex = items.findIndex(c => c.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const reorderedItems = arrayMove(items, oldIndex, newIndex);

        // Update order in database
        for (let i = 0; i < reorderedItems.length; i++) {
            if (reorderedItems[i].order !== i) {
                await updateCategory(reorderedItems[i].id, { order: i });
            }
        }
    };

    return (
        <div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('category.management')}</CardTitle>
                    <div className="flex gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="inline-block" tabIndex={0}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setResetConfirmOpen(true)}
                                        disabled={categories.length > 0}
                                        className={categories.length > 0 ? "pointer-events-none opacity-50" : ""}
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        {t('category.reset')}
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{categories.length > 0 ? t('category.resetDisabledHelp') : t('category.reset')}</p>
                            </TooltipContent>
                        </Tooltip>
                        <Button size="sm" onClick={handleAdd}>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('category.add')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="expense" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="expense">{t('transaction.expense')}</TabsTrigger>
                            <TabsTrigger value="income">{t('transaction.income')}</TabsTrigger>
                        </TabsList>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleDragEnd(e, null)}
                        >
                            <SortableContext
                                items={rootCategories.map(c => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-4">
                                    {rootCategories.map(root => {
                                        const children = getChildren(root.id);
                                        return (
                                            <SortableCategoryItem
                                                key={root.id}
                                                category={root}
                                                onEdit={handleEdit}
                                                onDelete={handleDeleteClick}
                                                isParent
                                            >
                                                {/* Children with their own DnD context */}
                                                {children.length > 0 && (
                                                    <DndContext
                                                        sensors={sensors}
                                                        collisionDetection={closestCenter}
                                                        onDragEnd={(e) => handleDragEnd(e, root.id)}
                                                    >
                                                        <SortableContext
                                                            items={children.map(c => c.id)}
                                                            strategy={verticalListSortingStrategy}
                                                        >
                                                            <div className="ml-6 mt-2 space-y-1 border-l pl-4">
                                                                {children.map(child => (
                                                                    <SortableCategoryItem
                                                                        key={child.id}
                                                                        category={child}
                                                                        onEdit={handleEdit}
                                                                        onDelete={handleDeleteClick}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </SortableContext>
                                                    </DndContext>
                                                )}
                                            </SortableCategoryItem>
                                        );
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {rootCategories.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">
                                {t('category.none')}
                            </p>
                        )}
                    </Tabs>
                </CardContent>
            </Card>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('category.confirmDelete')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('validation.confirmDeleteAction')}
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

            <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('category.confirmReset')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('category.resetDescription')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReset}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {t('common.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? t('category.edit') : t('category.add')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('common.name')}</Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={t('category.name')}
                            />
                        </div>

                        {/* Icon */}
                        <div className="grid gap-2">
                            <Label>Icon</Label>
                            <IconPicker
                                value={selectedIcon}
                                onChange={setSelectedIcon}
                                color={selectedColor}
                            />
                        </div>

                        {/* Color */}
                        <div className="grid gap-2">
                            <Label>{t('wallet.color')}</Label>
                            <ColorPicker
                                value={selectedColor}
                                onChange={setSelectedColor}
                            />
                        </div>

                        {/* Parent Category */}
                        <div className="grid gap-2">
                            <Label htmlFor="parent">{t('category.parent')}</Label>
                            <Select value={parentId} onValueChange={setParentId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('category.none')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="root">{t('category.none')}</SelectItem>
                                    {rootCategories
                                        .filter(r => r.id !== editingCategory?.id)
                                        .map(r => (
                                            <SelectItem key={r.id} value={r.id}>
                                                <div className="flex items-center gap-2">
                                                    <CategoryIcon iconName={r.icon} color={r.color} />
                                                    {r.name}
                                                </div>
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleSave} disabled={!newName.trim()}>
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
