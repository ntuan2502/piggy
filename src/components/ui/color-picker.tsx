"use client";

import { useState, useCallback, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Preset colors for quick selection
const PRESET_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
    "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
    "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#64748b"
];

interface ColorPickerProps {
    value?: string;
    onChange: (color: string) => void;
}

export function ColorPicker({ value = "#6366f1", onChange }: ColorPickerProps) {
    const [open, setOpen] = useState(false);
    const [customColor, setCustomColor] = useState(value);

    const handleCustomColorChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setCustomColor(newColor);
        onChange(newColor);
    }, [onChange]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    type="button"
                >
                    <div
                        className="w-6 h-6 rounded-md border border-input"
                        style={{ backgroundColor: value }}
                    />
                    <span className="text-muted-foreground font-mono text-sm">{value}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
                {/* Preset colors grid */}
                <div className="grid grid-cols-6 gap-2 mb-3">
                    {PRESET_COLORS.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => {
                                onChange(color);
                                setCustomColor(color);
                                setOpen(false);
                            }}
                            className={cn(
                                "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110",
                                value === color ? "border-foreground ring-2 ring-offset-2 ring-primary" : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>

                {/* Custom color input */}
                <div className="flex items-center gap-2 pt-2 border-t">
                    <Input
                        type="color"
                        value={customColor}
                        onChange={handleCustomColorChange}
                        className="w-10 h-10 p-1 cursor-pointer"
                    />
                    <Input
                        type="text"
                        value={customColor}
                        onChange={(e) => {
                            setCustomColor(e.target.value);
                            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                onChange(e.target.value);
                            }
                        }}
                        placeholder="#000000"
                        className="font-mono text-sm"
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}
