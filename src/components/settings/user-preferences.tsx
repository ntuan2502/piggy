"use client";
import { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAuth } from "@/components/providers/auth-provider";
import { updateUserProfile } from "@/services/user.service";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function UserPreferences() {
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const { profile } = useUserProfile();

    // Initialize state with defaults if profile values are missing
    // Initialize state with defaults if profile values are missing
    const [recentTransactionsLimit, setRecentTransactionsLimit] = useState(profile?.recentTransactionsLimit || 10);
    const [saving, setSaving] = useState(false);

    // Sync local state when profile loads
    useEffect(() => {
        if (profile) {
            setRecentTransactionsLimit(profile.recentTransactionsLimit || 10);
        }
    }, [profile]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateUserProfile(user.uid, {
                recentTransactionsLimit,
                language: i18n.language as 'en' | 'vi',
                theme: theme as 'light' | 'dark' | 'system',
            });
            toast.success(t('settings.preferencesSaved'));
        } catch (error: any) {
            console.error("Failed to save preferences:", error);
            toast.error(error?.message || t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('settings.userPreferences')}</CardTitle>
                <CardDescription>{t('settings.userPreferencesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Recent Transactions Limit */}
                <div className="space-y-2">
                    <Label htmlFor="recentLimit">{t('settings.recentTransactionsLimit')}</Label>
                    <Input
                        id="recentLimit"
                        type="number"
                        min="5"
                        max="50"
                        value={recentTransactionsLimit}
                        onChange={(e) => setRecentTransactionsLimit(parseInt(e.target.value) || 10)}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('settings.recentTransactionsLimitHelp')}
                    </p>
                </div>

                {/* Language Selection */}
                <div className="space-y-2">
                    <Label htmlFor="language">{t('settings.language')}</Label>
                    <Select value={i18n.language} onValueChange={handleLanguageChange}>
                        <SelectTrigger id="language">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="vi">Tiếng Việt</SelectItem>
                        </SelectContent>
                    </Select>
                </div>



                {/* Theme Selection */}
                <div className="space-y-2">
                    <Label htmlFor="theme">{t('theme.toggle')}</Label>
                    <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger id="theme">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">{t('theme.light')}</SelectItem>
                            <SelectItem value="dark">{t('theme.dark')}</SelectItem>
                            <SelectItem value="system">{t('theme.system')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>



                <Button onClick={handleSave} disabled={saving}>
                    {saving ? t('common.saving') : t('common.save')}
                </Button>
            </CardContent>
        </Card >
    );
}
