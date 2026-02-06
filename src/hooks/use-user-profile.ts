import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { UserProfile } from "@/types";
import { subscribeToUserProfile, createUserProfile } from "@/services/user.service";

export function useUserProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        if (!user) {
            const timer = setTimeout(() => {
                setProfile(null);
                setLoading(false);
            }, 0);
            return () => clearTimeout(timer);
        }

        // Ensure profile exists
        createUserProfile({ id: user.uid, email: user.email || "" });

        const unsubscribe = subscribeToUserProfile(user.uid, (data) => {
            if (mounted) {
                setProfile(data);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [user]);

    return { profile, loading };
}
