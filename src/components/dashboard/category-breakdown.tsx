import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { formatVNCurrency } from "@/lib/format"
import { REPORT_TRANSACTION_LIMIT } from "@/lib/constants"

import { ChevronRight } from "lucide-react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Transaction } from "@/types"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface CategoryData {
    category: string;
    amount: number;
    fill?: string;
    transactions: Transaction[];
}


interface CategoryBreakdownProps {
    data: CategoryData[];
    title?: string;
    type?: 'income' | 'expense';
}

export function CategoryBreakdown({ data, title, type = 'expense' }: CategoryBreakdownProps) {
    const { t } = useTranslation();

    // Sort data descending by amount
    const sortedData = [...data].sort((a, b) => b.amount - a.amount).slice(0, 10);
    const maxAmount = sortedData[0]?.amount || 1;
    const totalExpense = data.reduce((sum, item) => sum + item.amount, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title || t('report.topCategories')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-5">
                    {sortedData.map((item) => {
                        const percentage = totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(1) : "0";
                        return (
                            <Collapsible key={item.category}>
                                <CollapsibleTrigger className="w-full group">
                                    <div className="space-y-1.5 text-left">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1 overflow-hidden">
                                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                                                <span className="font-medium truncate" title={item.category}>
                                                    {item.category}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="font-mono text-muted-foreground">
                                                    {formatVNCurrency(item.amount)}
                                                </span>
                                                <span className="text-xs text-muted-foreground/70 w-[42px] text-right">
                                                    ({percentage}%)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden pl-5">
                                            <div
                                                className="h-full rounded-full transition-all duration-500 ease-in-out"
                                                style={{
                                                    width: `${(item.amount / maxAmount) * 100}%`,
                                                    backgroundColor: item.fill || "var(--primary)"
                                                }}
                                            />
                                        </div>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pl-5 pt-2 space-y-2">
                                    <div className="text-xs text-muted-foreground border-l-2 border-muted pl-3 py-1 space-y-2">
                                        {item.transactions.slice(0, REPORT_TRANSACTION_LIMIT).map((tx, idx) => (
                                            <div key={idx} className="flex justify-between items-start">
                                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                                    <span className="truncate text-foreground" title={tx.note}>{tx.note || t('common.none')}</span>
                                                    <span className="text-[10px] opacity-70">{format(new Date(tx.date), "dd/MM", { locale: vi })}</span>
                                                </div>
                                                <span className={`font-mono whitespace-nowrap ml-2 ${type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                                    {type === 'income' ? '+' : '-'}{formatVNCurrency(tx.amount)}
                                                </span>
                                            </div>
                                        ))}
                                        {item.transactions.length > REPORT_TRANSACTION_LIMIT && (
                                            <p className="text-[10px] text-center italic opacity-70">
                                                (+{item.transactions.length - REPORT_TRANSACTION_LIMIT} {t('common.more')})
                                            </p>
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    })}
                    {sortedData.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">{t('common.noData')}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
