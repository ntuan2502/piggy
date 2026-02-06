"use client";
import { useAuth } from "@/components/providers/auth-provider";
import ProtectedRoute from "@/components/layout/protected-route";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Wallet, PieChart, LogOut, Layers, Receipt } from "lucide-react";
import { auth } from "@/lib/firebase"; // Direct import for signOut
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import "@/lib/i18n";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();

    const handleLogout = async () => {
        await auth.signOut();
        router.push("/login");
    };

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
                {/* Sidebar */}
                <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h1 className="text-xl font-bold text-green-600">Piggy</h1>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <nav className="flex-1 p-4 space-y-2">
                        <Link href="/" className={cn("flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700", pathname === "/" && "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium")}>
                            <LayoutDashboard size={20} /> {t('common.dashboard')}
                        </Link>
                        <Link href="/wallets" className={cn("flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700", pathname === "/wallets" && "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium")}>
                            <Wallet size={20} /> {t('wallet.title')}
                        </Link>
                        <Link href="/transactions" className={cn("flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700", pathname === "/transactions" && "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium")}>
                            <Receipt size={20} /> {t('transaction.allTransactions')}
                        </Link>
                        <Link href="/categories" className={cn("flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700", pathname === "/categories" && "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium")}>
                            <Layers size={20} /> {t('category.title')}
                        </Link>
                        <Link href="/reports" className={cn("flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700", pathname === "/reports" && "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium")}>
                            <PieChart size={20} /> {t('report.title')}
                        </Link>
                    </nav>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                            <LogOut size={20} /> {t('common.logout')}
                        </Button>
                        <div className="flex justify-between items-center px-2">
                            <span className="text-sm text-gray-500">{t('theme.toggle')}/{t('theme.lang')}</span>
                            <div className="flex gap-1">
                                <LanguageSwitcher />
                                <ModeToggle />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-8">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
