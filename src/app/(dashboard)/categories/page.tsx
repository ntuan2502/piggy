"use client";

import { CategoryManager } from "@/components/settings/category-manager";
import { useTranslation } from "react-i18next";

export default function CategoriesPage() {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t('category.title')}</h1>
            <CategoryManager />
        </div>
    );
}
