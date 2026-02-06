import { db } from "@/lib/firebase";
import { Wallet } from "@/types";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp, getDocs } from "firebase/firestore";

const COLLECTION_NAME = "wallets";

export const addWallet = async (userId: string, wallet: Omit<Wallet, "id" | "userId" | "createdAt">) => {
    return addDoc(collection(db, COLLECTION_NAME), {
        ...wallet,
        userId,
        createdAt: serverTimestamp(),
    });
};

export const updateWallet = async (walletId: string, data: Partial<Wallet>) => {
    const docRef = doc(db, COLLECTION_NAME, walletId);
    return updateDoc(docRef, data);
};

export const deleteWallet = async (walletId: string) => {
    const docRef = doc(db, COLLECTION_NAME, walletId);
    return deleteDoc(docRef);
};

export const subscribeToWallets = (userId: string, callback: (wallets: Wallet[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
        const wallets = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Wallet[];
        callback(wallets);
    });
};
export const createDefaultWallet = async (userId: string) => {
    const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        await addWallet(userId, {
            name: "Cash",
            balance: 0,
            currency: "VND",
            color: "#16a34a", // green-600
            icon: "Wallet"
        });
    }
};
