"use client";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import ProtectedRoute from "@/components/layout/protected-route";
import { WalletInitializer } from "@/components/wallet-initializer";
import { SettingsSync } from "@/components/settings-sync";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import "@/lib/i18n";

import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { t } = useTranslation();
    const pathname = usePathname();

    const getPageTitle = () => {
        if (pathname?.includes("/transactions")) return t("transaction.book");
        if (pathname?.includes("/wallets")) return t("wallet.title");
        if (pathname?.includes("/reports")) return t("report.title");
        if (pathname?.includes("/settings")) return t("settings.title");
        return t("common.dashboard");
    };
    return (
        <ProtectedRoute>
            <WalletInitializer />
            <SettingsSync />

            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </ProtectedRoute>
    );
}
