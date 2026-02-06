import { db } from "@/lib/firebase";
import { Transaction } from "@/types";
import { collection, query, where, onSnapshot, orderBy, limit, serverTimestamp, runTransaction, doc, getDoc } from "firebase/firestore";

const COLLECTION_NAME = "transactions";
const WALLET_COLLECTION = "wallets";

export const addTransaction = async (userId: string, transaction: Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">) => {
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
                updatedAt: serverTimestamp(),
            });
        });

    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

/**
 * Create a transfer between two wallets
 * Creates two linked transactions: expense from source, income to destination
 */
export const addTransfer = async (
    userId: string,
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    date: Date,
    note?: string
) => {
    try {
        await runTransaction(db, async (firestoreTransaction) => {
            // 1. Create transaction refs
            const expenseTransactionRef = doc(collection(db, COLLECTION_NAME));
            const incomeTransactionRef = doc(collection(db, COLLECTION_NAME));

            // 2. Get both wallets
            const fromWalletRef = doc(db, WALLET_COLLECTION, fromWalletId);
            const toWalletRef = doc(db, WALLET_COLLECTION, toWalletId);

            const fromWalletDoc = await firestoreTransaction.get(fromWalletRef);
            const toWalletDoc = await firestoreTransaction.get(toWalletRef);

            if (!fromWalletDoc.exists()) {
                throw "Source wallet does not exist!";
            }
            if (!toWalletDoc.exists()) {
                throw "Destination wallet does not exist!";
            }

            // 3. Calculate new balances
            const fromWalletData = fromWalletDoc.data();
            const toWalletData = toWalletDoc.data();

            const newFromBalance = (fromWalletData.balance || 0) - amount;
            const newToBalance = (toWalletData.balance || 0) + amount;

            // 4. Update wallet balances
            firestoreTransaction.update(fromWalletRef, { balance: newFromBalance });
            firestoreTransaction.update(toWalletRef, { balance: newToBalance });

            // 5. Create expense transaction (from source wallet)
            firestoreTransaction.set(expenseTransactionRef, {
                userId,
                walletId: fromWalletId,
                categoryId: "transfer", // Special category for transfers
                amount,
                date,
                note: note || `Transfer to ${toWalletData.name}`,
                type: "expense",
                isTransfer: true,
                linkedTransactionId: incomeTransactionRef.id,
                toWalletId: toWalletId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // 6. Create income transaction (to destination wallet)
            firestoreTransaction.set(incomeTransactionRef, {
                userId,
                walletId: toWalletId,
                categoryId: "transfer", // Special category for transfers
                amount,
                date,
                note: note || `Transfer from ${fromWalletData.name}`,
                type: "income",
                isTransfer: true,
                linkedTransactionId: expenseTransactionRef.id,
                toWalletId: fromWalletId, // Store source wallet for reference
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        });
    } catch (e) {
        console.error("Transfer failed: ", e);
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
    updates: Partial<Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">>
) => {
    try {
        await runTransaction(db, async (firestoreTransaction) => {
            // ===== PHASE 1: ALL READS =====

            // 1. Read main transaction
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

            // 2. Read main wallet
            const walletRef = doc(db, WALLET_COLLECTION, oldData.walletId);
            const walletDoc = await firestoreTransaction.get(walletRef);

            if (!walletDoc.exists()) {
                throw "Wallet does not exist!";
            }

            const walletData = walletDoc.data();

            // 3. If transfer, read linked info
            let linkedTransactionRef = null;
            let linkedTransactionData = null;
            let linkedWalletRef = null;
            let linkedWalletData = null;

            if (oldData.isTransfer && oldData.linkedTransactionId) {
                linkedTransactionRef = doc(db, COLLECTION_NAME, oldData.linkedTransactionId);
                const linkedTransactionDoc = await firestoreTransaction.get(linkedTransactionRef);

                if (linkedTransactionDoc.exists()) {
                    linkedTransactionData = linkedTransactionDoc.data() as Transaction;
                    linkedWalletRef = doc(db, WALLET_COLLECTION, linkedTransactionData.walletId);
                    const linkedWalletDoc = await firestoreTransaction.get(linkedWalletRef);
                    if (linkedWalletDoc.exists()) {
                        linkedWalletData = linkedWalletDoc.data();
                    }
                }
            }

            // ===== PHASE 2: ALL WRITES =====

            // Handle Non-Transfer Case
            if (!oldData.isTransfer) {
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

                firestoreTransaction.update(walletRef, { balance: currentBalance });
                firestoreTransaction.update(transactionRef, {
                    ...updates,
                    updatedAt: serverTimestamp()
                });
            }
            // Handle Transfer Case
            else if (linkedTransactionData && linkedWalletData && linkedWalletRef && linkedTransactionRef) {
                // Revert both wallets
                let mainBalance = walletData.balance || 0;
                let linkedBalance = linkedWalletData.balance || 0;

                // Revert main (oldData.type is either income or expense)
                if (oldData.type === 'income') mainBalance -= oldData.amount;
                else mainBalance += oldData.amount;

                // Revert linked
                if (linkedTransactionData.type === 'income') linkedBalance -= linkedTransactionData.amount;
                else linkedBalance += linkedTransactionData.amount;

                // Apply new values (Amount is shared)
                const newAmount = updates.amount ?? oldData.amount;

                // Re-apply to main
                if (oldData.type === 'income') mainBalance += newAmount;
                else mainBalance -= newAmount;

                // Re-apply to linked
                if (linkedTransactionData.type === 'income') linkedBalance += newAmount;
                else linkedBalance -= newAmount;

                // Prepare synced updates (date, amount, note)
                const syncedUpdates = {
                    amount: newAmount,
                    date: updates.date ?? oldData.date,
                    note: updates.note ?? oldData.note,
                    updatedAt: serverTimestamp(),
                };

                // Update everything
                firestoreTransaction.update(walletRef, { balance: mainBalance });
                firestoreTransaction.update(linkedWalletRef, { balance: linkedBalance });
                firestoreTransaction.update(transactionRef, syncedUpdates);
                firestoreTransaction.update(linkedTransactionRef, syncedUpdates);
            }
        });
    } catch (e) {
        console.error("Update transaction failed: ", e);
        throw e;
    }
};

export const deleteTransaction = async (transactionId: string, userId: string) => {
    try {
        await runTransaction(db, async (firestoreTransaction) => {
            // ===== PHASE 1: ALL READS =====

            // 1. Read main transaction
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

            // 2. Read main wallet
            const walletRef = doc(db, WALLET_COLLECTION, transactionData.walletId);
            const walletDoc = await firestoreTransaction.get(walletRef);

            if (!walletDoc.exists()) {
                throw "Wallet does not exist!";
            }

            const walletData = walletDoc.data();

            // 3. If transfer, read linked transaction and wallet BEFORE any writes
            let linkedTransactionRef = null;
            let linkedTransactionData = null;
            let linkedWalletRef = null;
            let linkedWalletData = null;

            if (transactionData.isTransfer && transactionData.linkedTransactionId) {
                linkedTransactionRef = doc(db, COLLECTION_NAME, transactionData.linkedTransactionId);
                const linkedTransactionDoc = await firestoreTransaction.get(linkedTransactionRef);

                if (linkedTransactionDoc.exists()) {
                    linkedTransactionData = linkedTransactionDoc.data() as Transaction;

                    // Read linked wallet
                    linkedWalletRef = doc(db, WALLET_COLLECTION, linkedTransactionData.walletId);
                    const linkedWalletDoc = await firestoreTransaction.get(linkedWalletRef);

                    if (linkedWalletDoc.exists()) {
                        linkedWalletData = linkedWalletDoc.data();
                    }
                }
            }

            // ===== PHASE 2: ALL WRITES =====

            // 1. Revert main transaction effect on main wallet
            let currentBalance = walletData.balance || 0;
            if (transactionData.type === 'income' || transactionData.type === 'debt') {
                currentBalance -= transactionData.amount;
            } else if (transactionData.type === 'expense' || transactionData.type === 'loan') {
                currentBalance += transactionData.amount;
            }
            firestoreTransaction.update(walletRef, { balance: currentBalance });

            // 2. Delete main transaction
            firestoreTransaction.delete(transactionRef);

            // 3. If transfer, revert linked transaction and delete it
            if (linkedTransactionData && linkedWalletData && linkedWalletRef && linkedTransactionRef) {
                let linkedBalance = linkedWalletData.balance || 0;

                // Revert linked transaction effect
                if (linkedTransactionData.type === 'income' || linkedTransactionData.type === 'debt') {
                    linkedBalance -= linkedTransactionData.amount;
                } else if (linkedTransactionData.type === 'expense' || linkedTransactionData.type === 'loan') {
                    linkedBalance += linkedTransactionData.amount;
                }

                firestoreTransaction.update(linkedWalletRef, { balance: linkedBalance });
                firestoreTransaction.delete(linkedTransactionRef);
            }
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
