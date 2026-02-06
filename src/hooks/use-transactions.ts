"use client";
import { useState, useEffect } from "react";
import { subscribeToTransactions } from "@/services/transaction.service";
import { useAuth } from "@/components/providers/auth-provider";
import { Transaction } from "@/types";

export function useTransactions() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        if (!user) {
            const timer = setTimeout(() => {
                setTransactions([]);
                setLoading(false);
            }, 0);
            return () => clearTimeout(timer);
        }
        const unsubscribe = subscribeToTransactions(user.uid, (data) => {
            if (mounted) {
                setTransactions(data);
                setLoading(false);
            }
        });
        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [user]);

    return { transactions, loading };
}
