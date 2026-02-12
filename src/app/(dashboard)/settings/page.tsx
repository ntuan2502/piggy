
import { cookies } from "next/headers";
import vi from "@/lib/locales/vi";
import en from "@/lib/locales/en";
import SettingsClient from "./page-client";

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'vi';
    const t = locale === 'en' ? en : vi;

    return {
        title: t.settings.title,
    };
}

export default function SettingsPage() {
    return <SettingsClient />;
}
