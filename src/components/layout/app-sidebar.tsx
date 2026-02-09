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
        router.push("/");
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
        { href: "/transactions", icon: Receipt, label: t('transaction.book') },
        { href: "/reports", icon: PieChart, label: t('report.title') },
        { href: "/settings", icon: Settings, label: t('settings.title') },
    ];

    return (
        <Sidebar collapsible="icon" className="border-r-0 bg-sidebar/50 backdrop-blur-xl">
            <SidebarHeader className="pb-4 pt-6">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild onClick={handleNavigation} className="hover:bg-transparent data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            <Link href="/">
                                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                                    <span className="text-xl font-bold">P</span>
                                </div>
                                <div className="flex flex-col gap-1 leading-none ml-1">
                                    <span className="font-bold text-lg tracking-tight">{t('common.appName')}</span>
                                    <span className="text-xs font-medium text-muted-foreground">{t('common.appTagline')}</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-2">
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href}
                                        tooltip={item.label}
                                        onClick={handleNavigation}
                                        className="h-10 rounded-lg px-3 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-md data-[active=true]:shadow-emerald-500/20"
                                    >
                                        <Link href={item.href} className="flex items-center gap-3 font-medium">
                                            <item.icon className="size-5" />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg" className="rounded-xl border border-sidebar-border bg-sidebar hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                        {user?.photoURL && (
                                            <AvatarImage src={user.photoURL} alt="Avatar" className="object-cover" />
                                        )}
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col gap-1 leading-none text-left">
                                        <span className="font-semibold text-sm truncate">{user?.displayName || t('common.user')}</span>
                                        <span className="text-xs text-muted-foreground truncate opacity-70">{user?.email}</span>
                                    </div>
                                    <ChevronUp className="ml-auto size-4 text-muted-foreground" />
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
