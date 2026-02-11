"use client";

import { useState, useMemo } from "react";
import { icons } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";


interface IconPickerProps {
    value?: string;
    onChange: (icon: string) => void;
    color?: string;
}

export function IconPicker({ value = "Circle", onChange, color = "#6366f1" }: IconPickerProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const ValidIcons = icons as unknown as Record<string, typeof icons.Circle>;

    const allIconNames = useMemo(() => Object.keys(ValidIcons), [ValidIcons]);

    const filteredIcons = useMemo(() => {
        if (!search) return allIconNames;
        return allIconNames.filter(icon =>
            icon.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, allIconNames]);

    const SelectedIcon = ValidIcons[value] || ValidIcons.Circle;

    return (
        <div className="space-y-2">
            {/* Trigger Button */}
            <Button
                variant="outline"
                className="w-full justify-between gap-2"
                type="button"
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="flex items-center justify-center w-7 h-7 rounded-md"
                        style={{ backgroundColor: color + "20" }}
                    >
                        <SelectedIcon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="text-muted-foreground">{value}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </Button>

            {/* Inline Icon Grid (Collapsible) */}
            {open && (
                <div className="rounded-lg border bg-card p-2 space-y-2">
                    <Input
                        placeholder={t('common.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 text-sm"
                    />
                    <div
                        className="grid grid-cols-7 gap-1 max-h-[200px] overflow-y-auto p-1"
                        style={{ touchAction: "pan-y" }}
                    >
                        {filteredIcons.map((iconName) => {
                            const Icon = ValidIcons[iconName];
                            if (!Icon) return null;
                            return (
                                <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => {
                                        onChange(iconName);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center justify-center aspect-square rounded-md hover:bg-accent transition-colors",
                                        value === iconName && "bg-accent ring-2 ring-primary ring-inset"
                                    )}
                                    title={iconName}
                                >
                                    <Icon className="w-4 h-4" style={{ color: value === iconName ? color : undefined }} />
                                </button>
                            );
                        })}
                    </div>
                    {filteredIcons.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-4">
                            {t('common.noData')}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
