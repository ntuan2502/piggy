"use client";
import ProtectedRoute from "@/components/layout/protected-route";
import { useTranslation } from "react-i18next";
import { MigrationModal } from "@/components/migration-modal";
import { WalletInitializer } from "@/components/wallet-initializer";
import { SettingsSync } from "@/components/settings-sync";
import {
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import "@/lib/i18n";

import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { t } = useTranslation();

    return (
        <ProtectedRoute>
            <WalletInitializer />
            <SettingsSync />
            <MigrationModal />
            <SidebarProvider>
                <AppSidebar />
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-4 md:hidden">
                        <SidebarTrigger />
                        <span className="font-semibold">{t('common.appName')}</span>
                    </div>
                    {children}
                </main>
            </SidebarProvider>
        </ProtectedRoute>
    );
}
