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

    // Default Vietnamese Categories - Consolidated Set
    const defaults: SeedParent[] = [
        // ═══════════════════════════════════
        // EXPENSE CATEGORIES
        // ═══════════════════════════════════

        // 1. Ăn uống
        {
            name: "Ăn uống", type: "expense", icon: "Utensils", color: "#ef4444", children: [
                { name: "Ăn tiệm/Nhà hàng", icon: "UtensilsCrossed", color: "#dc2626" },
                { name: "Cafe & Đồ uống", icon: "Coffee", color: "#7c3aed" },
                { name: "Đi chợ/Siêu thị", icon: "ShoppingBasket", color: "#65a30d" },
                { name: "Ăn vặt", icon: "Cookie", color: "#f59e0b" },
            ]
        },

        // 2. Mua sắm
        {
            name: "Mua sắm", type: "expense", icon: "ShoppingBag", color: "#3b82f6", children: [
                { name: "Thời trang & Phụ kiện", icon: "Shirt", color: "#ec4899" },
                { name: "Đồ công nghệ", icon: "Smartphone", color: "#6366f1" },
                { name: "Mỹ phẩm & Làm đẹp", icon: "Sparkles", color: "#f472b6" },
                { name: "Đồ gia dụng & Đời sống", icon: "Refrigerator", color: "#0891b2" },
            ]
        },

        // 3. Di chuyển
        {
            name: "Di chuyển", type: "expense", icon: "Car", color: "#f59e0b", children: [
                { name: "Chi phí xe cộ (Xăng/Sửa/Gửi)", icon: "Fuel", color: "#d97706" },
                { name: "Dịch vụ di chuyển (Taxi/Vé)", icon: "Bus", color: "#fbbf24" },
                { name: "Bảo hiểm xe", icon: "Shield", color: "#b45309" },
            ]
        },

        // 4. Nhà cửa & Hóa đơn
        {
            name: "Nhà cửa & Hóa đơn", type: "expense", icon: "House", color: "#10b981", children: [
                { name: "Tiền nhà/Trả góp", icon: "Building2", color: "#059669" },
                { name: "Điện/Nước/Gas/Phí QL", icon: "Zap", color: "#eab308" },
                { name: "Net/Phone/Streaming", icon: "Wifi", color: "#3b82f6" },
                { name: "Sửa chữa & Trang trí", icon: "Hammer", color: "#047857" },
                { name: "Dịch vụ gia đình", icon: "Sparkles", color: "#34d399" },
            ]
        },

        // 5. Sức khỏe
        {
            name: "Sức khỏe", type: "expense", icon: "Heart", color: "#f43f5e", children: [
                { name: "Khám chữa bệnh & Thuốc", icon: "Stethoscope", color: "#e11d48" },
                { name: "Thể thao & Gym", icon: "Dumbbell", color: "#fb923c" },
                { name: "Bảo hiểm y tế", icon: "ShieldPlus", color: "#0d9488" },
            ]
        },

        // 6. Phát triển bản thân
        {
            name: "Phát triển bản thân", type: "expense", icon: "GraduationCap", color: "#6366f1", children: [
                { name: "Giáo dục & Đào tạo", icon: "BookOpen", color: "#818cf8" },
                { name: "Sách vở & Tài liệu", icon: "BookMarked", color: "#a78bfa" },
            ]
        },

        // 7. Giải trí & Hưởng thụ
        {
            name: "Giải trí & Hưởng thụ", type: "expense", icon: "Gamepad2", color: "#8b5cf6", children: [
                { name: "Vui chơi & Giải trí", icon: "Ticket", color: "#d946ef" },
                { name: "Du lịch", icon: "Plane", color: "#38bdf8" },
                { name: "Sở thích (Hobby)", icon: "Palette", color: "#c084fc" },
            ]
        },

        // 8. Gia đình & Xã hội
        {
            name: "Gia đình & Xã hội", type: "expense", icon: "Users", color: "#ec4899", children: [
                { name: "Con cái", icon: "Baby", color: "#fb7185" },
                { name: "Biếu tặng & Hiếu hỉ", icon: "Gift", color: "#f472b6" },
                { name: "Thú cưng", icon: "Dog", color: "#c084fc" },
                { name: "Từ thiện", icon: "HandHeart", color: "#34d399" },
            ]
        },

        // 9. Đầu tư & Tích lũy
        {
            name: "Đầu tư & Tích lũy", type: "expense", icon: "PiggyBank", color: "#eab308", children: [
                { name: "Đầu tư tài chính (Vàng/CK/Crypto)", icon: "TrendingUp", color: "#f59e0b" },
                { name: "Tiết kiệm", icon: "Wallet", color: "#854d0e" },
                { name: "Bảo hiểm nhân thọ", icon: "ShieldAlert", color: "#ca8a04" },
                { name: "Bất động sản", icon: "Building2", color: "#b45309" },
            ]
        },

        // 10. Khác
        {
            name: "Khác", type: "expense", icon: "CircleDollarSign", color: "#78716c", children: [
                { name: "Chi phí khác", icon: "ReceiptText", color: "#a8a29e" },
            ]
        },

        // ═══════════════════════════════════
        // INCOME CATEGORIES
        // ═══════════════════════════════════

        // 1. Lương & Thưởng
        {
            name: "Lương & Thưởng", type: "income", icon: "Briefcase", color: "#22c55e", children: [
                { name: "Lương chính", icon: "Banknote", color: "#4ade80" },
                { name: "Thưởng & Phụ cấp", icon: "Trophy", color: "#fbbf24" },
            ]
        },

        // 2. Kinh doanh & Đầu tư
        {
            name: "Kinh doanh & Đầu tư", type: "income", icon: "TrendingUp", color: "#3b82f6", children: [
                { name: "Doanh thu kinh doanh", icon: "BadgeDollarSign", color: "#60a5fa" },
                { name: "Lãi đầu tư/Tiết kiệm", icon: "PiggyBank", color: "#eab308" },
                { name: "Cho thuê/BĐS", icon: "House", color: "#d97706" },
            ]
        },

        // 3. Thu nhập khác
        {
            name: "Thu nhập khác", type: "income", icon: "Coins", color: "#a855f7", children: [
                { name: "Quà tặng/Lì xì", icon: "Gift", color: "#c084fc" },
                { name: "Thanh lý đồ cũ", icon: "Tag", color: "#d946ef" },
                { name: "Thu nhập khác", icon: "RotateCcw", color: "#e879f9" },
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
