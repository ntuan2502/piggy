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
    // Check if categories already exist
    const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
    const snapshot = await getDocs(q);

    // Only seed if no categories exist
    if (!snapshot.empty) return;

    const batch = writeBatch(db);
    let order = 0;

    interface SeedChild {
        name: string;
        icon: string;
        color: string;
        type?: string;
    }

    interface SeedParent {
        name: string;
        type: string;
        icon: string;
        color: string;
        children?: SeedChild[];
    }

    // Default Vietnamese Categories
    const defaults: SeedParent[] = [
        // Expense Leaders
        {
            name: "Ăn uống", type: "expense", icon: "Utensils", color: "#ef4444", children: [
                { name: "Nhà hàng", icon: "Utensils", color: "#f87171" },
                { name: "Cà phê", icon: "Coffee", color: "#fb923c" },
                { name: "Đi chợ/Siêu thị", icon: "ShoppingBasket", color: "#bef264" },
            ]
        },
        {
            name: "Mua sắm", type: "expense", icon: "ShoppingBag", color: "#3b82f6", children: [
                { name: "Quần áo", icon: "Shirt", color: "#60a5fa" },
                { name: "Điện tử", icon: "Smartphone", color: "#93c5fd" },
                { name: "Làm đẹp", icon: "Sparkles", color: "#f472b6" },
            ]
        },
        {
            name: "Di chuyển", type: "expense", icon: "Bus", color: "#f59e0b", children: [
                { name: "Xăng xe", icon: "Fuel", color: "#fbbf24" },
                { name: "Bảo dưỡng", icon: "Wrench", color: "#d97706" },
                { name: "Taxi/Grab", icon: "Car", color: "#fcd34d" },
            ]
        },
        {
            name: "Nhà cửa", type: "expense", icon: "Home", color: "#10b981", children: [
                { name: "Tiền điện", icon: "Zap", color: "#34d399" },
                { name: "Tiền nước", icon: "Droplets", color: "#6ee7b7" },
                { name: "Internet/TV", icon: "Wifi", color: "#10b981" },
            ]
        },
        {
            name: "Giải trí", type: "expense", icon: "Gamepad2", color: "#8b5cf6", children: [
                { name: "Xem phim", icon: "Film", color: "#a78bfa" },
                { name: "Du lịch", icon: "Plane", color: "#c4b5fd" },
            ]
        },

        // Income Leaders
        {
            name: "Thu nhập", type: "income", icon: "Wallet", color: "#22c55e", children: [
                { name: "Lương", icon: "Banknote", color: "#4ade80", type: "income" },
                { name: "Thưởng", icon: "Gift", color: "#86efac", type: "income" },
                { name: "Lãi tiết kiệm", icon: "PiggyBank", color: "#16a34a", type: "income" },
            ]
        },
    ];

    for (const parent of defaults) {
        // Create Parent
        const parentRef = doc(collection(db, COLLECTION_NAME));
        batch.set(parentRef, {
            userId,
            name: parent.name,
            type: parent.type,
            icon: parent.icon,
            color: parent.color,
            parentId: null,
            isDefault: true,
            order: order++,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Create Children
        if (parent.children) {
            let childOrder = 0;
            for (const child of parent.children) {
                const childRef = doc(collection(db, COLLECTION_NAME));
                batch.set(childRef, {
                    userId,
                    name: child.name,
                    type: child.type || parent.type, // Inherit type if not set
                    icon: child.icon,
                    color: child.color,
                    parentId: parentRef.id,
                    isDefault: true,
                    order: childOrder++,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }
        }
    }

    await batch.commit();
};

export const resetCategories = async (userId: string) => {
    // 1. Delete all existing categories for this user
    const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    // 2. Re-seed categories
    // We export seedCategories logic above but slightly modified to force run
    // Actually we can just call the logic inside seedCategories but bypassing the empty check
    // Or simpler: clear then call seedCategories, assuming seedCategories checks if empty.

    // Since we just deleted everything, calling seedCategories(userId) works perfectly.
    await seedCategories(userId);
};

export const updateCategory = async (id: string, data: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
};

export const deleteCategory = async (id: string, userId: string) => {
    const batch = writeBatch(db);

    // 1. Delete the category itself
    const docRef = doc(db, COLLECTION_NAME, id);
    batch.delete(docRef);

    // 2. Find and delete all children
    // MUST include userId in query to satisfy Firestore security rules
    const q = query(
        collection(db, COLLECTION_NAME),
        where("parentId", "==", id),
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach((childDoc) => {
        batch.delete(childDoc.ref);
    });

    await batch.commit();
};
