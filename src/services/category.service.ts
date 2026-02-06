import { db } from "@/lib/firebase";
import { Category } from "@/types";
import { collection, addDoc, query, where, getDocs, onSnapshot, writeBatch, doc, serverTimestamp, updateDoc } from "firebase/firestore";

const COLLECTION_NAME = "categories";

export const addCategory = async (category: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
};

export const subscribeToCategories = (userId: string, callback: (categories: Category[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
        const categories: Category[] = [];
        snapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() } as Category);
        });
        callback(categories);
    });
};

export const seedCategories = async (userId: string) => {
    // Fetch existing
    const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const existingCats = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));

    const batch = writeBatch(db);
    let opsCount = 0;

    // Helper to find existing parent
    const findParent = (name: string, type: string) =>
        existingCats.find(c => c.name === name && c.type === type && !c.parentId);

    // Parent Categories
    const parents = [
        { name: "Food & Beverage", type: "expense", icon: "Utensils", color: "#ef4444" },
        { name: "Shopping", type: "expense", icon: "ShoppingBag", color: "#3b82f6" },
        { name: "Transportation", type: "expense", icon: "Bus", color: "#f59e0b" },
        { name: "Income", type: "income", icon: "Wallet", color: "#22c55e" },
    ];

    const parentRefs: Record<string, string> = {}; // Name -> ID

    for (const p of parents) {
        const existing = findParent(p.name, p.type);
        if (existing) {
            parentRefs[p.name] = existing.id;
        } else {
            const ref = doc(collection(db, COLLECTION_NAME));
            batch.set(ref, {
                userId,
                name: p.name,
                type: p.type,
                icon: p.icon,
                color: p.color,
                parentId: null,
                isDefault: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            parentRefs[p.name] = ref.id;
            opsCount++;
        }
    }

    // Child Categories
    const children = [
        { name: "Restaurants", parent: "Food & Beverage" },
        { name: "Coffee", parent: "Food & Beverage" },
        { name: "Groceries", parent: "Food & Beverage" },
        { name: "Clothing", parent: "Shopping" },
        { name: "Electronics", parent: "Shopping" },
        { name: "Taxi", parent: "Transportation" },
        { name: "Parking", parent: "Transportation" },
        { name: "Salary", parent: "Income", type: "income" },
        { name: "Bonus", parent: "Income", type: "income" },
    ];

    for (const c of children) {
        const parentId = parentRefs[c.parent];
        if (!parentId) continue; // Should not happen if parents created/found correctly

        // Check if child exists under this parent
        const exists = existingCats.find(e => e.name === c.name && e.parentId === parentId);

        if (!exists) {
            const ref = doc(collection(db, COLLECTION_NAME));
            batch.set(ref, {
                userId,
                name: c.name,
                type: c.type || "expense",
                icon: "Circle",
                color: "#9ca3af",
                parentId: parentId,
                isDefault: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            opsCount++;
        }
    }

    if (opsCount > 0) {
        await batch.commit();
    }
};

export const updateCategory = async (id: string, data: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
};

export const deleteCategory = async (id: string) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await import("firebase/firestore").then(m => m.deleteDoc(docRef));
};
