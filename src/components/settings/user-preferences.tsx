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
import { Eye, EyeOff } from "lucide-react";

export function UserPreferences() {
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const { profile } = useUserProfile();

    // Local state for pending changes (not applied until Save)
    const [recentTransactionsLimit, setRecentTransactionsLimit] = useState(10);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
    const [selectedTheme, setSelectedTheme] = useState<string>('light');
    const [geminiModel, setGeminiModel] = useState<string>('gemini-2.5-flash-lite');
    const [geminiApiKey, setGeminiApiKey] = useState<string>('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [saving, setSaving] = useState(false);

    // Sync local state when profile loads from Firebase
    useEffect(() => {
        if (profile) {
            setRecentTransactionsLimit(profile.recentTransactionsLimit || 10);
            setSelectedLanguage(profile.language || 'en');
            setSelectedTheme(profile.theme || 'light');
            setGeminiModel(profile.geminiModel || 'gemini-2.5-flash-lite');
            setGeminiApiKey(profile.geminiApiKey || '');
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
                geminiModel,
                geminiApiKey: geminiApiKey.trim(),
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

                {/* AI Model Selection */}
                <div className="space-y-2">
                    <Label htmlFor="geminiModel">{t('settings.aiModel')}</Label>
                    <Select value={geminiModel} onValueChange={setGeminiModel}>
                        <SelectTrigger id="geminiModel" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite {t('settings.aiModelLiteDesc')}</SelectItem>
                            <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash {t('settings.aiModelFlashDesc')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {t('settings.aiModelHelp')}
                    </p>
                </div>

                {/* AI API Key */}
                <div className="space-y-2">
                    <Label htmlFor="apiKey">{t('settings.geminiApiKey')}</Label>
                    <div className="relative">
                        <Input
                            id="apiKey"
                            type={showApiKey ? "text" : "password"}
                            placeholder="AIzaSy..."
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            className="pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowApiKey(!showApiKey)}
                        >
                            {showApiKey ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t('settings.apiKeyHelp')}
                    </p>
                </div>

                <Button onClick={handleSave} disabled={saving}>
                    {saving ? t('common.saving') : t('common.save')}
                </Button>
            </CardContent>
        </Card>
    );
}
