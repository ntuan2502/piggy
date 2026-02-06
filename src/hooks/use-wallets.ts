"use client";
import { useState, useEffect } from "react";
import { subscribeToWallets, createDefaultWallet } from "@/services/wallet.service";
import { useAuth } from "@/components/providers/auth-provider";
import { Wallet } from "@/types";

export function useWallets() {
    const { user } = useAuth();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        if (!user) {
            const timer = setTimeout(() => {
                setWallets([]);
                setLoading(false);
            }, 0);
            return () => clearTimeout(timer);
        }
        const unsubscribe = subscribeToWallets(user.uid, (data) => {
            if (mounted) {
                setWallets(data);
                setLoading(false);
                if (data.length === 0) {
                    createDefaultWallet(user.uid);
                }
            }
        });
        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [user]);

    return { wallets, loading };
}
