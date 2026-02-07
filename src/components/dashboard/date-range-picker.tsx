"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns"
import { vi, enUS } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useTranslation } from "react-i18next"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DateRangePicker({
    date,
    setDate,
    className,
}: {
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    className?: string
}) {
    const { t, i18n } = useTranslation()
    const locale = i18n.language === 'vi' ? vi : enUS

    // Presets
    const presets = [
        { label: t('common.thisMonth'), getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
        { label: t('common.lastMonth'), getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
        { label: t('common.thisYear'), getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
    ]

    const handlePresetChange = (value: string) => {
        const preset = presets.find(p => p.label === value)
        if (preset) {
            setDate(preset.getValue())
        }
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd/MM/yyyy", { locale })} -{" "}
                                    {format(date.to, "dd/MM/yyyy", { locale })}
                                </>
                            ) : (
                                format(date.from, "dd/MM/yyyy", { locale })
                            )
                        ) : (
                            <span>{t('common.pickDate')}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-2 border-b bg-muted/50">
                        <Select onValueChange={handlePresetChange}>
                            <SelectTrigger className="w-full bg-background">
                                <SelectValue placeholder={t('common.quickSelect')} />
                            </SelectTrigger>
                            <SelectContent position="popper">
                                {presets.map(p => (
                                    <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        locale={locale}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
