
import { cookies } from "next/headers";
import vi from "@/lib/locales/vi";
import en from "@/lib/locales/en";
import ReportsClient from "./page-client";

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'vi';
    const t = locale === 'en' ? en : vi;

    return {
        title: t.report.title,
    };
}

export default function ReportsPage() {
    return <ReportsClient />;
}
