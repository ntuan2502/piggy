/**
 * Format number to Vietnamese locale
 * Example: 1000000.5 -> "1.000.000,50"
 */
export function formatVNCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Parse Vietnamese formatted number to number
 * Example: "1.000.000,50" -> 1000000.5
 */
export function parseVNCurrency(value: string): number {
    // Remove thousand separators (dots) and replace decimal comma with dot
    const normalized = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
}

/**
 * Format number input as user types (Vietnamese format)
 * Handles partial inputs like "1000" -> "1.000"
 */
export function formatVNCurrencyInput(value: string): string {
    // Remove all non-digit and non-comma characters
    const cleaned = value.replace(/[^\d,]/g, '');

    // Split by comma to handle decimal part
    const parts = cleaned.split(',');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Format integer part with thousand separators
    const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Add decimal part if exists
    if (decimalPart !== undefined) {
        return formatted + ',' + decimalPart.slice(0, 2); // Max 2 decimal places
    }

    return formatted;
}

/**
 * Format date to Vietnamese format (dd/mm/yyyy)
 */
export function formatVNDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Format date with time to Vietnamese format (dd/mm/yyyy HH:mm)
 */
export function formatVNDateTime(date: Date): string {
    const dateStr = formatVNDate(date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}`;
}
