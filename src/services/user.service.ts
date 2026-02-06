import { db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";

const COLLECTION_NAME = "users";

export const createUserProfile = async (user: UserProfile) => {
    const ref = doc(db, COLLECTION_NAME, user.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        await setDoc(ref, user);
    }
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
    const ref = doc(db, COLLECTION_NAME, userId);
    await updateDoc(ref, data);
};

export const subscribeToUserProfile = (userId: string, callback: (profile: UserProfile | null) => void) => {
    const ref = doc(db, COLLECTION_NAME, userId);
    return onSnapshot(ref, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() } as UserProfile);
        } else {
            callback(null);
        }
    });
};
