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

    // Local state for pending changes (not applied until Save)
    const [recentTransactionsLimit, setRecentTransactionsLimit] = useState(10);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
    const [selectedTheme, setSelectedTheme] = useState<string>('light');
    const [saving, setSaving] = useState(false);

    // Sync local state when profile loads from Firebase
    useEffect(() => {
        if (profile) {
            setRecentTransactionsLimit(profile.recentTransactionsLimit || 10);
            setSelectedLanguage(profile.language || 'en');
            setSelectedTheme(profile.theme || 'light');
        }
    }, [profile]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            // Save to Firebase first
            await updateUserProfile(user.uid, {
                recentTransactionsLimit,
                language: selectedLanguage as 'en' | 'vi',
                theme: selectedTheme as 'light' | 'dark' | 'system',
            });

            // Apply changes locally after successful save
            if (i18n.language !== selectedLanguage) {
                i18n.changeLanguage(selectedLanguage);
            }
            if (theme !== selectedTheme) {
                setTheme(selectedTheme);
            }

            toast.success(t('settings.preferencesSaved'));
        } catch (error: unknown) {
            console.error("Failed to save preferences:", error);
            const errorMessage = error instanceof Error ? error.message : t('common.error');
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
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
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger id="language" className="w-full">
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
                    <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                        <SelectTrigger id="theme" className="w-full">
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
        </Card>
    );
}
