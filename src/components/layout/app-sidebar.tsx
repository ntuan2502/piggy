"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Wallet, PieChart, LogOut, Receipt, Settings, ChevronUp } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function AppSidebar() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    const { isMobile, setOpenMobile } = useSidebar();

    const handleLogout = async () => {
        await auth.signOut();
        router.push("/login");
    };

    const handleNavigation = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.email) return "U";
        const email = user.email;
        return email.charAt(0).toUpperCase();
    };

    const navItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: t('common.dashboard') },
        { href: "/wallets", icon: Wallet, label: t('wallet.title') },
        { href: "/transactions", icon: Receipt, label: t('transaction.allTransactions') },
        { href: "/reports", icon: PieChart, label: t('report.title') },
        { href: "/settings", icon: Settings, label: t('settings.title') },
    ];

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild onClick={handleNavigation}>
                            <Link href="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-green-600 text-white">
                                    <span className="text-lg font-bold">P</span>
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">{t('common.appName')}</span>
                                    <span className="text-xs text-muted-foreground">{t('common.appTagline')}</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href}
                                        tooltip={item.label}
                                        onClick={handleNavigation}
                                    >
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg">
                                    <Avatar className="h-8 w-8">
                                        {user?.photoURL && (
                                            <AvatarImage src={user.photoURL} alt="Avatar" className="object-cover" />
                                        )}
                                        <AvatarFallback className="bg-green-600 text-white">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col gap-0.5 leading-none">
                                        <span className="font-semibold text-sm">{user?.displayName || t('common.user')}</span>
                                        <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                                    </div>
                                    <ChevronUp className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                                <DropdownMenuItem asChild onClick={handleNavigation}>
                                    <Link href="/settings" className="cursor-pointer">
                                        <Settings className="h-4 w-4" />
                                        <span>{t('settings.title')}</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { handleNavigation(); handleLogout(); }} className="cursor-pointer text-red-600">
                                    <LogOut className="h-4 w-4" />
                                    <span>{t('common.logout')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
