import { Timestamp } from "firebase/firestore";

export type TransactionType = 'income' | 'expense' | 'debt' | 'loan';
export type WalletType = 'available' | 'credit';

export interface Wallet {
    id: string;
    userId: string;
    name: string;
    balance: number;
    initialBalance: number;
    currency: 'VND' | 'USD';
    type: WalletType;
    icon?: string;
    color?: string;
    createdAt: Date | Timestamp;
    updatedAt?: Date | Timestamp;
}

export interface Category {
    id: string;
    userId: string;
    name: string;
    type: TransactionType;
    icon?: string;
    parentId?: string | null;
    color?: string;
    order?: number;
    isDefault?: boolean;
    createdAt?: Date | Timestamp;
    updatedAt?: Date | Timestamp;
}

export interface Transaction {
    id: string;
    userId: string;
    walletId: string;
    categoryId?: string;
    amount: number;
    date: Date; // Transformed date
    note?: string;
    tags?: string[];
    type: TransactionType;
    createdAt: Date | Timestamp;
    updatedAt?: Date | Timestamp;
    // Transfer-related fields
    isTransfer?: boolean;           // Flag to identify transfer transactions
    linkedTransactionId?: string;   // Link to paired transaction (for transfers)
    toWalletId?: string;            // Destination wallet ID (for display purposes)
}

export interface UserProfile {
    id: string;
    email: string;
    defaultWalletId?: string;
    currency?: string;
    recentTransactionsLimit?: number; // Default: 10
    language?: 'en' | 'vi';          // Default: 'en'
    theme?: 'light' | 'dark' | 'system'; // Default: 'light'
    geminiApiKey?: string;
    createdAt?: Date | Timestamp;
    updatedAt?: Date | Timestamp;
}
