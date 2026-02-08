import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { formatVNCurrency } from "@/lib/format"

interface CategoryData {
    category: string;
    amount: number;
    fill?: string;
}

export function CategoryBreakdown({ data }: { data: CategoryData[] }) {
    const { t } = useTranslation();

    // Sort data descending by amount
    const sortedData = [...data].sort((a, b) => b.amount - a.amount).slice(0, 10);
    const maxAmount = sortedData[0]?.amount || 1;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('report.topCategories')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-5">
                    {sortedData.map((item) => (
                        <div key={item.category} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium truncate mr-2" title={item.category}>
                                    {item.category}
                                </span>
                                <span className="font-mono text-muted-foreground shrink-0">
                                    {formatVNCurrency(item.amount)}
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-in-out"
                                    style={{
                                        width: `${(item.amount / maxAmount) * 100}%`,
                                        backgroundColor: item.fill || "var(--primary)"
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                    {sortedData.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">{t('common.noData')}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
