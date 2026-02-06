"use client";
import { useEffect, useState } from "react";
import { Wallet } from "@/types";
import { subscribeToWallets } from "@/services/wallet.service";
import { useAuth } from "@/components/providers/auth-provider";

export const useWallets = () => {
    const { user } = useAuth();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setWallets([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToWallets(user.uid, (fetchedWallets) => {
            setWallets(fetchedWallets);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { wallets, loading };
};
