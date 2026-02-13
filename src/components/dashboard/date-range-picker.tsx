"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfWeek, endOfWeek, subWeeks, startOfQuarter, endOfQuarter, isSameDay } from "date-fns"
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
    const [isOpen, setIsOpen] = React.useState(false)
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)

    // Presets with keys
    const presets = [
        { key: 'thisWeek', label: t('common.thisWeek'), getValue: () => ({ from: startOfWeek(new Date(), { locale }), to: endOfWeek(new Date(), { locale }) }) },
        { key: 'lastWeek', label: t('common.lastWeek'), getValue: () => ({ from: startOfWeek(subWeeks(new Date(), 1), { locale }), to: endOfWeek(subWeeks(new Date(), 1), { locale }) }) },
        { key: 'thisMonth', label: t('common.thisMonth'), getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
        { key: 'lastMonth', label: t('common.lastMonth'), getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
        { key: 'thisQuarter', label: t('common.thisQuarter'), getValue: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
        { key: 'thisYear', label: t('common.thisYear'), getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
        { key: 'custom', label: t('common.custom'), getValue: () => undefined },
    ]

    const checkPresetMatch = (currentDate: DateRange | undefined, presetKey: string) => {
        if (!currentDate?.from || !currentDate?.to) return false;

        const preset = presets.find(p => p.key === presetKey);
        if (!preset) return false;

        const presetValue = preset.getValue();
        if (!presetValue) return false; // Custom has no value to match

        return isSameDay(currentDate.from, presetValue.from) && isSameDay(currentDate.to, presetValue.to);
    }

    const getPresetValue = () => {
        for (const preset of presets) {
            if (preset.key === 'custom') continue;
            if (checkPresetMatch(date, preset.key)) {
                return preset.key;
            }
        }
        return 'custom';
    }

    const currentPreset = getPresetValue();

    const handlePresetSelect = (key: string) => {
        if (key === 'custom') {
            setIsCalendarOpen(true);
        } else {
            const preset = presets.find(p => p.key === key);
            if (preset) {
                const range = preset.getValue();
                if (range) {
                    setDate(range);
                    setIsOpen(false);
                    setIsCalendarOpen(false);
                }
            }
        }
    }

    // sync calendar visibility when popover opens
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            const activePreset = getPresetValue();
            if (activePreset === 'custom') {
                setIsCalendarOpen(true);
            } else {
                setIsCalendarOpen(false);
            }
        }
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={isOpen} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full md:w-[260px] justify-start text-left font-normal",
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
                    <div className="flex">
                        <div className="flex flex-col gap-1 p-2 border-r bg-muted/20 min-w-[150px]">
                            {presets.map(preset => (
                                <Button
                                    key={preset.key}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "justify-start font-medium text-sm px-3",
                                        currentPreset === preset.key && "bg-accent text-accent-foreground"
                                    )}
                                    onClick={() => handlePresetSelect(preset.key)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                        {isCalendarOpen && (
                            <div className="p-2">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                    locale={locale}
                                />
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
