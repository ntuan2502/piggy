import { Timestamp } from "firebase/firestore";

export type TransactionType = 'income' | 'expense' | 'debt' | 'loan';

export interface Wallet {
    id: string;
    userId: string;
    name: string;
    balance: number;
    currency: 'VND' | 'USD';
    icon?: string;
    color?: string;
    createdAt: Date | Timestamp;
}

export interface Category {
    id: string;
    userId: string;
    name: string;
    type: TransactionType;
    icon?: string;
    parentId?: string;
    color?: string;
    isDefault?: boolean;
}

export interface Transaction {
    id: string;
    userId: string;
    walletId: string;
    categoryId: string;
    amount: number;
    date: Date; // Transformed date
    note?: string;
    tags?: string[];
    type: TransactionType;
    createdAt: Date | Timestamp;
}

export interface UserProfile {
    id: string;
    email: string;
    defaultWalletId?: string;
    currency?: string;
}
