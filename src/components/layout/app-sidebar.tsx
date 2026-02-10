"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Wallet,
    PieChart,
    LogOut,
    Receipt,
    Settings,
    ChevronUp,
} from "lucide-react";
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
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

    const getUserInitials = () => {
        if (user?.displayName) {
            return user.displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return "U";
    };

    const navItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: t("common.dashboard") },
        { href: "/wallets", icon: Wallet, label: t("wallet.title") },
        { href: "/transactions", icon: Receipt, label: t("transaction.book") },
        { href: "/reports", icon: PieChart, label: t("report.title") },
        { href: "/settings", icon: Settings, label: t("settings.title") },
    ];

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/" onClick={handleNavigation}>
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <span className="text-lg font-bold">P</span>
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">{t("common.appName")}</span>
                                    <span className="text-xs">{t("common.appTagline")}</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>{t("common.dashboard")}</SidebarGroupLabel>
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
                                <SidebarMenuButton
                                    size="lg"
                                    tooltip={user?.displayName || t("common.user")}
                                >
                                    <Avatar className="size-8 rounded-lg">
                                        <AvatarImage src={user?.photoURL || ""} alt="Avatar" />
                                        <AvatarFallback className="rounded-lg">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {user?.displayName || t("common.user")}
                                        </span>
                                        <span className="truncate text-xs">
                                            {user?.email}
                                        </span>
                                    </div>
                                    <ChevronUp className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            >
                                <DropdownMenuItem asChild>
                                    <Link href="/settings" onClick={handleNavigation}>
                                        <Settings />
                                        <span>{t("settings.title")}</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => {
                                        handleNavigation();
                                        handleLogout();
                                    }}
                                >
                                    <LogOut />
                                    <span>{t("common.logout")}</span>
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
