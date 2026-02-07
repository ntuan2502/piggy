"use client";

import { useState, useMemo } from "react";
import { icons } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

// Curated list of common icons for categories
const CATEGORY_ICONS = [
    // Food & Drinks
    "Utensils", "Coffee", "Pizza", "Apple", "Beef", "Cake", "Cookie", "IceCream", "Wine", "Beer",
    // Shopping
    "ShoppingBag", "ShoppingCart", "Gift", "Shirt", "Watch", "Gem", "Glasses",
    // Transportation
    "Car", "Bus", "Train", "Plane", "Bike", "Ship", "Fuel",
    // Home & Living
    "Home", "Bed", "Sofa", "Lamp", "Tv", "Refrigerator", "WashingMachine",
    // Health & Fitness
    "Heart", "Pill", "Stethoscope", "Dumbbell", "Activity",
    // Entertainment
    "Music", "Film", "Gamepad2", "Ticket", "PartyPopper", "Sparkles",
    // Work & Education
    "Briefcase", "Building2", "GraduationCap", "BookOpen", "Laptop", "Smartphone",
    // Finance
    "Wallet", "CreditCard", "Banknote", "PiggyBank", "TrendingUp", "TrendingDown", "Receipt",
    // Utilities
    "Lightbulb", "Droplets", "Flame", "Wifi", "Phone",
    // Travel
    "MapPin", "Globe", "Palmtree", "Mountain", "Tent", "Camera",
    // Other
    "Star", "CircleDollarSign", "HandCoins", "Coins", "BadgeDollarSign", "ReceiptText",
    "Users", "Baby", "Dog", "Cat", "Scissors", "Wrench", "Paintbrush",
    "Circle", "Square", "Triangle", "Hexagon", "Bookmark", "Tag", "Flag"
];

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

    const filteredIcons = useMemo(() => {
        if (!search) return CATEGORY_ICONS;
        return CATEGORY_ICONS.filter(icon =>
            icon.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    const SelectedIcon = ValidIcons[value] || ValidIcons.Circle;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    type="button"
                >
                    <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg"
                        style={{ backgroundColor: color + "20" }}
                    >
                        <SelectedIcon className="w-5 h-5" style={{ color }} />
                    </div>
                    <span className="text-muted-foreground">{value}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
                <Input
                    placeholder={t('common.search') || "Search icons..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-3"
                />
                <div className="grid grid-cols-8 gap-1 max-h-[300px] overflow-y-auto">
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
                                    "flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent transition-colors",
                                    value === iconName && "bg-accent ring-2 ring-primary"
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
                        No icons found
                    </p>
                )}
            </PopoverContent>
        </Popover>
    );
}
