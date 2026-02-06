import { db } from "@/lib/firebase";
import { Transaction } from "@/types";
import { collection, query, where, onSnapshot, orderBy, limit, serverTimestamp, runTransaction, doc, getDoc } from "firebase/firestore";

const COLLECTION_NAME = "transactions";
const WALLET_COLLECTION = "wallets";

export const addTransaction = async (userId: string, transaction: Omit<Transaction, "id" | "userId" | "createdAt">) => {
    try {
        await runTransaction(db, async (transactionCommon) => {
            // 1. Create Transaction Ref
            const newTransactionRef = doc(collection(db, COLLECTION_NAME));

            // 2. Get Wallet Doc
            const walletRef = doc(db, WALLET_COLLECTION, transaction.walletId);
            const walletDoc = await transactionCommon.get(walletRef);

            if (!walletDoc.exists()) {
                throw "Wallet does not exist!";
            }

            const walletData = walletDoc.data();
            const currentBalance = walletData.balance || 0;
            let newBalance = currentBalance;

            // 3. Calculate New Balance
            if (transaction.type === 'income') {
                newBalance += transaction.amount;
            } else if (transaction.type === 'expense') {
                newBalance -= transaction.amount;
            }
            // Debt/Loan logic depends on semantics (Borrowing = Income?, Lending = Expense?). 
            // Simplified: Debt (Borrowing) -> + Balance? Loan (Lending) -> - Balance?
            // Money Lover: Debt (I owe) -> Inflow? Loan (They owe) -> Outflow?
            // Let's keep it simple: Income (+), Expense (-). Debt/Loan just record for now or treat as Income/Expense.
            // I'll assume Debt is Inflow (money comes in), Loan is Outflow (money goes out).
            else if (transaction.type === 'debt') {
                newBalance += transaction.amount;
            } else if (transaction.type === 'loan') {
                newBalance -= transaction.amount;
            }


            // 4. Update Wallet
            transactionCommon.update(walletRef, { balance: newBalance });

            // 5. Set Transaction
            transactionCommon.set(newTransactionRef, {
                ...transaction,
                userId,
                createdAt: serverTimestamp(),
            });
        });

    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

export const subscribeToTransactions = (userId: string, callback: (transactions: Transaction[]) => void, limitCount = 20) => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId),
        orderBy("date", "desc"),
        limit(limitCount)
    );
    return onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate ? data.date.toDate() : new Date(data.date), // Handle Timestamp
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            };
        }) as Transaction[];
        callback(transactions);
    });
};

export const updateTransaction = async (
    transactionId: string,
    userId: string,
    updates: Partial<Omit<Transaction, "id" | "userId" | "createdAt">>
) => {
    try {
        await runTransaction(db, async (firestoreTransaction) => {
            const transactionRef = doc(db, COLLECTION_NAME, transactionId);
            const transactionDoc = await firestoreTransaction.get(transactionRef);

            if (!transactionDoc.exists()) {
                throw "Transaction does not exist!";
            }

            const oldData = transactionDoc.data() as Transaction;

            // Verify ownership
            if (oldData.userId !== userId) {
                throw "Unauthorized!";
            }

            // Get wallet
            const walletRef = doc(db, WALLET_COLLECTION, oldData.walletId);
            const walletDoc = await firestoreTransaction.get(walletRef);

            if (!walletDoc.exists()) {
                throw "Wallet does not exist!";
            }

            const walletData = walletDoc.data();
            let currentBalance = walletData.balance || 0;

            // Revert old transaction effect
            if (oldData.type === 'income' || oldData.type === 'debt') {
                currentBalance -= oldData.amount;
            } else if (oldData.type === 'expense' || oldData.type === 'loan') {
                currentBalance += oldData.amount;
            }

            // Apply new transaction effect
            const newAmount = updates.amount ?? oldData.amount;
            const newType = updates.type ?? oldData.type;

            if (newType === 'income' || newType === 'debt') {
                currentBalance += newAmount;
            } else if (newType === 'expense' || newType === 'loan') {
                currentBalance -= newAmount;
            }

            // Update wallet balance
            firestoreTransaction.update(walletRef, { balance: currentBalance });

            // Update transaction
            firestoreTransaction.update(transactionRef, updates);
        });
    } catch (e) {
        console.error("Update transaction failed: ", e);
        throw e;
    }
};

export const deleteTransaction = async (transactionId: string, userId: string) => {
    try {
        await runTransaction(db, async (firestoreTransaction) => {
            const transactionRef = doc(db, COLLECTION_NAME, transactionId);
            const transactionDoc = await firestoreTransaction.get(transactionRef);

            if (!transactionDoc.exists()) {
                throw "Transaction does not exist!";
            }

            const transactionData = transactionDoc.data() as Transaction;

            // Verify ownership
            if (transactionData.userId !== userId) {
                throw "Unauthorized!";
            }

            // Get wallet
            const walletRef = doc(db, WALLET_COLLECTION, transactionData.walletId);
            const walletDoc = await firestoreTransaction.get(walletRef);

            if (!walletDoc.exists()) {
                throw "Wallet does not exist!";
            }

            const walletData = walletDoc.data();
            let currentBalance = walletData.balance || 0;

            // Revert transaction effect
            if (transactionData.type === 'income' || transactionData.type === 'debt') {
                currentBalance -= transactionData.amount;
            } else if (transactionData.type === 'expense' || transactionData.type === 'loan') {
                currentBalance += transactionData.amount;
            }

            // Update wallet balance
            firestoreTransaction.update(walletRef, { balance: currentBalance });

            // Delete transaction
            firestoreTransaction.delete(transactionRef);
        });
    } catch (e) {
        console.error("Delete transaction failed: ", e);
        throw e;
    }
};

export const getTransactionById = async (transactionId: string, userId: string): Promise<Transaction | null> => {
    try {
        const transactionRef = doc(db, COLLECTION_NAME, transactionId);
        const transactionDoc = await getDoc(transactionRef);

        if (!transactionDoc.exists()) {
            return null;
        }

        const data = transactionDoc.data();

        // Verify ownership
        if (data.userId !== userId) {
            throw "Unauthorized!";
        }

        return {
            id: transactionDoc.id,
            ...data,
            date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        } as Transaction;
    } catch (e) {
        console.error("Get transaction failed: ", e);
        return null;
    }
};
