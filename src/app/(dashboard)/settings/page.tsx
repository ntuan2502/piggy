"use client";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryManager } from "@/components/settings/category-manager";
import { UserPreferences } from "@/components/settings/user-preferences";
import { FolderTree, User } from "lucide-react";

export default function SettingsPage() {
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            <Tabs defaultValue="preferences" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="preferences" className="gap-2">
                        <User className="h-4 w-4" />
                        {t('settings.userPreferences')}
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-2">
                        <FolderTree className="h-4 w-4" />
                        {t('category.management')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="preferences" className="space-y-4">
                    <UserPreferences />
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                    <CategoryManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}
