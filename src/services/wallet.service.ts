import { db } from "@/lib/firebase";
import { Wallet, WalletType } from "@/types";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp, getDocs, Timestamp } from "firebase/firestore";

const COLLECTION_NAME = "wallets";


// Helper to get max order for a type
const getMaxOrder = async (userId: string, type: WalletType) => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId),
        where("type", "==", type)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;

    const max = Math.max(...snapshot.docs.map(d => d.data().order || 0));
    return max;
};

export const addWallet = async (userId: string, wallet: Omit<Wallet, "id" | "userId" | "createdAt" | "updatedAt">) => {
    const currentMaxOrder = await getMaxOrder(userId, wallet.type);

    return addDoc(collection(db, COLLECTION_NAME), {
        ...wallet,
        userId,
        order: currentMaxOrder + 1,
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

export const reorderWallets = async (updates: { id: string, order: number }[]) => {
    const { runTransaction } = await import("firebase/firestore");
    await runTransaction(db, async (transaction) => {
        for (const update of updates) {
            const docRef = doc(db, COLLECTION_NAME, update.id);
            transaction.update(docRef, { order: update.order });
        }
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

        // Sort: Type (Available first) -> Order (asc) -> CreatedAt (desc)
        wallets.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'available' ? -1 : 1;
            }
            if ((a.order ?? 999) !== (b.order ?? 999)) {
                return (a.order ?? 999) - (b.order ?? 999);
            }
            // Fallback to creation date
            const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : a.createdAt;
            const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : b.createdAt;
            return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
        });

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
    const wallets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Wallet[];

    return wallets.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
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
            icon: "Wallet",
            order: 1
        });
    }
};

/**
 * Recalculates the balance for all wallets of a user based on transaction history.
 * Formula: newBalance = initialBalance + SUM(income) - SUM(expense)
 * For transfers: outgoing = expense, incoming = income on that wallet
 */
export const recalculateAllWalletBalances = async (userId: string): Promise<number> => {
    const { runTransaction } = await import("firebase/firestore");

    // Get all wallets for user
    const walletsQuery = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
    const walletsSnapshot = await getDocs(walletsQuery);

    if (walletsSnapshot.empty) return 0;

    // Get all transactions for user
    const transactionsQuery = query(collection(db, "transactions"), where("userId", "==", userId));
    const transactionsSnapshot = await getDocs(transactionsQuery);

    // Calculate balance delta per wallet from transactions
    const walletDeltas: Record<string, number> = {};

    transactionsSnapshot.forEach((doc) => {
        const tx = doc.data();
        const walletId = tx.walletId;
        const amount = tx.amount || 0;
        const type = tx.type;

        if (!walletDeltas[walletId]) {
            walletDeltas[walletId] = 0;
        }

        if (type === "income") {
            walletDeltas[walletId] += amount;
        } else if (type === "expense") {
            walletDeltas[walletId] -= amount;
        }
        // Note: transfers are already recorded as expense/income on respective wallets
    });

    // Update each wallet with recalculated balance
    let updatedCount = 0;
    await runTransaction(db, async (firestoreTransaction) => {
        for (const walletDoc of walletsSnapshot.docs) {
            const walletData = walletDoc.data();
            const walletId = walletDoc.id;
            const initialBalance = walletData.initialBalance || 0;
            const transactionDelta = walletDeltas[walletId] || 0;
            const newBalance = initialBalance + transactionDelta;

            firestoreTransaction.update(doc(db, COLLECTION_NAME, walletId), {
                balance: newBalance,
                updatedAt: serverTimestamp()
            });
            updatedCount++;
        }
    });

    return updatedCount;
};
