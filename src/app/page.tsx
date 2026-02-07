"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Receipt, PieChart, Layers, ArrowRight, Shield, Smartphone, Globe, Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import "@/lib/i18n";

export default function LandingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // If user is already logged in, redirect to dashboard
    useEffect(() => {
        if (!loading && user) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            router.push("/dashboard");
        } catch (error) {
            console.error("Login failed:", error);
            setIsLoggingIn(false);
        }
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'vi' ? 'en' : 'vi';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const features = [
        {
            icon: Wallet,
            title: t('landing.featureWallet'),
            description: t('landing.featureWalletDesc'),
        },
        {
            icon: Receipt,
            title: t('landing.featureTransaction'),
            description: t('landing.featureTransactionDesc'),
        },
        {
            icon: Layers,
            title: t('landing.featureCategory'),
            description: t('landing.featureCategoryDesc'),
        },
        {
            icon: PieChart,
            title: t('landing.featureReport'),
            description: t('landing.featureReportDesc'),
        },
    ];

    const highlights = [
        {
            icon: Shield,
            title: t('landing.highlightSecurity'),
            description: t('landing.highlightSecurityDesc'),
        },
        {
            icon: Smartphone,
            title: t('landing.highlightResponsive'),
            description: t('landing.highlightResponsiveDesc'),
        },
        {
            icon: Globe,
            title: t('landing.highlightLanguage'),
            description: t('landing.highlightLanguageDesc'),
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Top Bar with Language & Theme Toggles */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                            <span className="text-sm font-bold">P</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{t('common.appName')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Language Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleLanguage}
                            className="h-9 px-3 gap-2"
                        >
                            <Globe className="h-4 w-4" />
                            <span className="text-sm font-medium">{i18n.language === 'vi' ? 'VI' : 'EN'}</span>
                        </Button>

                        {/* Theme Toggle */}
                        {mounted && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                        {theme === 'dark' ? (
                                            <Moon className="h-4 w-4" />
                                        ) : theme === 'light' ? (
                                            <Sun className="h-4 w-4" />
                                        ) : (
                                            <Monitor className="h-4 w-4" />
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setTheme('light')}>
                                        <Sun className="mr-2 h-4 w-4" />
                                        {t('theme.light')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                                        <Moon className="mr-2 h-4 w-4" />
                                        {t('theme.dark')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme('system')}>
                                        <Monitor className="mr-2 h-4 w-4" />
                                        {t('theme.system')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-14">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10 dark:from-green-600/5 dark:to-emerald-600/5"></div>
                <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Logo */}
                        <div className="flex justify-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="flex aspect-square size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30">
                                    <span className="text-3xl font-bold">P</span>
                                </div>
                                <div className="text-left">
                                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                        {t('common.appName')}
                                    </h1>
                                    <p className="text-lg text-muted-foreground">{t('common.appTagline')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tagline */}
                        <h2 className="text-2xl md:text-4xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                            {t('landing.tagline')} <br className="hidden md:block" />
                            <span className="text-green-600 dark:text-green-400">{t('landing.taglineHighlight')}</span>
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                            {t('landing.description')}
                        </p>

                        {/* CTA Button */}
                        <Button
                            size="lg"
                            onClick={handleGoogleLogin}
                            disabled={isLoggingIn}
                            className="h-14 px-8 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25 transition-all hover:shadow-xl hover:shadow-green-500/30"
                        >
                            {isLoggingIn ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    {t('landing.ctaLoading')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    {t('landing.cta')}
                                    <ArrowRight className="w-5 h-5" />
                                </span>
                            )}
                        </Button>
                        <p className="mt-4 text-sm text-muted-foreground">
                            {t('landing.ctaSubtext')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="container mx-auto px-4">
                    <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100">
                        {t('landing.featuresTitle')}
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {features.map((feature, index) => (
                            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
                                <CardHeader className="pb-2">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                                        <feature.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-sm">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Highlights Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-8">
                            {highlights.map((highlight, index) => (
                                <div key={index} className="text-center">
                                    <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                                        <highlight.icon className="h-7 w-7 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h4 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100">
                                        {highlight.title}
                                    </h4>
                                    <p className="text-muted-foreground text-sm">
                                        {highlight.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                            <span className="text-sm font-bold">P</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{t('common.appName')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        © 2026 {t('common.appName')}. {t('landing.footer')}
                    </p>
                </div>
            </footer>
        </div>
    );
}
