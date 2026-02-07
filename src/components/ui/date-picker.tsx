"use client";

import * as React from "react";
import { format, setMonth, setYear } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    disabled?: boolean;
    placeholder?: string;
    disableFuture?: boolean;
    className?: string;
}

const MONTHS_VI = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

const MONTHS_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export function DatePicker({
    value,
    onChange,
    disabled = false,
    placeholder,
    disableFuture = true,
    className,
}: DatePickerProps) {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = React.useState(false);
    const [calendarDate, setCalendarDate] = React.useState<Date>(value || new Date());

    const isVietnamese = i18n.language === 'vi';
    const locale = isVietnamese ? vi : enUS;
    const monthNames = isVietnamese ? MONTHS_VI : MONTHS_EN;

    const today = new Date();
    const currentYear = today.getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    const handleMonthChange = (monthIndex: string) => {
        const newDate = setMonth(calendarDate, parseInt(monthIndex));
        setCalendarDate(newDate);
    };

    const handleYearChange = (year: string) => {
        const newDate = setYear(calendarDate, parseInt(year));
        setCalendarDate(newDate);
    };

    const handleTodayClick = () => {
        const now = new Date();
        setCalendarDate(now);
        onChange(now);
        setOpen(false);
    };

    const handleSelect = (date: Date | undefined) => {
        if (date) {
            onChange(date);
            setOpen(false);
        }
    };

    const formatDate = (date: Date) => {
        return format(date, isVietnamese ? "dd/MM/yyyy" : "MMM dd, yyyy", { locale });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? formatDate(value) : (placeholder || t('common.pickDate'))}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                {/* Month/Year Selectors */}
                <div className="grid grid-cols-2 gap-2 p-3 border-b">
                    <Select
                        value={calendarDate.getMonth().toString()}
                        onValueChange={handleMonthChange}
                    >
                        <SelectTrigger className="w-full h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {monthNames.map((month, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                    {month}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={calendarDate.getFullYear().toString()}
                        onValueChange={handleYearChange}
                    >
                        <SelectTrigger className="w-full h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Calendar */}
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleSelect}
                    month={calendarDate}
                    onMonthChange={setCalendarDate}
                    locale={locale}
                    disabled={disableFuture ? (date) => date > today : undefined}
                    initialFocus
                />

                {/* Today Button */}
                <div className="p-3 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleTodayClick}
                    >
                        {isVietnamese ? "Hôm nay" : "Today"}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
