"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createDefaultWallet, subscribeToWallets } from "@/services/wallet.service";

export function WalletInitializer() {
    const { user } = useAuth();
    const initializingRef = useRef(false);

    useEffect(() => {
        if (!user) return;

        // Subscribe to verify if user needs default wallet
        // We use subscribe instead of getDocs to ensure we have latest state
        // and to be consistent with how other components see data
        const unsubscribe = subscribeToWallets(user.uid, (wallets) => {
            if (wallets.length === 0 && !initializingRef.current) {
                console.log("Initializing default wallet...");
                initializingRef.current = true;
                createDefaultWallet(user.uid)
                    .then(() => {
                        console.log("Default wallet created successfully");
                    })
                    .catch((err) => {
                        console.error("Failed to create default wallet:", err);
                        initializingRef.current = false; // Reset on failure to retry
                    });
            }
        });

        return () => unsubscribe();
    }, [user]);

    return null; // This component renders nothing
}
