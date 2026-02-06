import { db } from "@/lib/firebase";
import { Wallet, WalletType } from "@/types";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp, getDocs } from "firebase/firestore";

const COLLECTION_NAME = "wallets";

export const addWallet = async (userId: string, wallet: Omit<Wallet, "id" | "userId" | "createdAt" | "updatedAt">) => {
    return addDoc(collection(db, COLLECTION_NAME), {
        ...wallet,
        userId,
        // When creating, balance initialized as initialBalance
        balance: wallet.initialBalance ?? wallet.balance,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

export const updateWallet = async (walletId: string, data: Partial<Wallet>) => {
    const docRef = doc(db, COLLECTION_NAME, walletId);

    // If initialBalance is being updated, we need to adjust the current balance by the delta
    if (data.initialBalance !== undefined) {
        // We need the current wallet state to calculate the delta
        // Since we are in a simple update, we might need to fetch or use transaction
        // But for simplicity in this app's current architecture, we'll do a get then update
        // (Transaction would be safer but let's keep it consistent with current service style unless needed)
        // Actually, let's use a transaction to be safe with balances
        const { runTransaction } = await import("firebase/firestore");
        await runTransaction(db, async (firestoreTransaction) => {
            const walletDoc = await firestoreTransaction.get(docRef);
            if (!walletDoc.exists()) throw "Wallet not found";

            const oldWallet = walletDoc.data() as Wallet;
            const delta = data.initialBalance! - (oldWallet.initialBalance || 0);

            const newBalance = (oldWallet.balance || 0) + delta;

            firestoreTransaction.update(docRef, {
                ...data,
                balance: newBalance,
                updatedAt: serverTimestamp()
            });
        });
        return;
    }

    return updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
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

export const getWalletsByType = async (userId: string, type: WalletType): Promise<Wallet[]> => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId),
        where("type", "==", type)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Wallet[];
};

export const createDefaultWallet = async (userId: string) => {
    const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        await addWallet(userId, {
            name: "Cash",
            balance: 0,
            initialBalance: 0,
            currency: "VND",
            type: "available",
            color: "#16a34a", // green-600
            icon: "Wallet"
        });
    }
};
