"use client";

import { useEffect } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

export function SettingsSync() {
    const { profile, loading } = useUserProfile();
    const { setTheme, theme } = useTheme();
    const { i18n } = useTranslation();

    useEffect(() => {
        if (!loading && profile) {
            // Sync Language
            const profileLang = profile.language || 'en';
            if (i18n.language !== profileLang) {
                i18n.changeLanguage(profileLang);
            }

            // Sync Theme
            const profileTheme = profile.theme || 'light';
            if (theme !== profileTheme) {
                setTheme(profileTheme);
            }
        }
    }, [profile, loading, setTheme, theme, i18n]);

    return null; // This component render nothing
}
