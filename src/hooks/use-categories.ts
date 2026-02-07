"use client";
import { useState, useEffect } from "react";
import { subscribeToCategories } from "@/services/category.service";
import { useAuth } from "@/components/providers/auth-provider";
import { Category } from "@/types";

export function useCategories() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        if (!user) {
            const timer = setTimeout(() => {
                setCategories([]);
                setLoading(false);
            }, 0);
            return () => clearTimeout(timer);
        }
        const unsubscribe = subscribeToCategories(user.uid, (data) => {
            if (mounted) {
                setCategories(data);
                setLoading(false);
            }
        });
        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [user]);

    return { categories, loading };
}
