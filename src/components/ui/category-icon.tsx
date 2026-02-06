import { icons } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
    iconName?: string;
    color?: string;
    className?: string;
}

export function CategoryIcon({ iconName, color, className }: CategoryIconProps) {
    const ValidIcons = icons as unknown as Record<string, typeof icons.Circle>;
    const LucideIcon = ValidIcons[iconName || "Circle"];

    if (!LucideIcon) {
        return <div className={cn("w-4 h-4 rounded-full", className)} style={{ backgroundColor: color || "#ccc" }} />;
    }

    return <LucideIcon className={cn("w-4 h-4", className)} color={color || "currentColor"} />;
}
