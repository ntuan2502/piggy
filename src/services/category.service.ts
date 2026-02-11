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

    // Default Vietnamese Categories - Comprehensive set
    const defaults: SeedParent[] = [
        // ═══════════════════════════════════
        // EXPENSE CATEGORIES
        // ═══════════════════════════════════

        // 1. Ăn uống
        {
            name: "Ăn uống", type: "expense", icon: "Utensils", color: "#ef4444", children: [
                { name: "Cơm/Bún/Phở", icon: "Soup", color: "#f87171" },
                { name: "Nhà hàng", icon: "UtensilsCrossed", color: "#dc2626" },
                { name: "Cà phê/Trà", icon: "Coffee", color: "#92400e" },
                { name: "Đi chợ/Siêu thị", icon: "ShoppingBasket", color: "#65a30d" },
                { name: "Ăn vặt", icon: "Cookie", color: "#f59e0b" },
                { name: "Đồ uống", icon: "Wine", color: "#7c3aed" },
            ]
        },

        // 2. Mua sắm
        {
            name: "Mua sắm", type: "expense", icon: "ShoppingBag", color: "#3b82f6", children: [
                { name: "Quần áo", icon: "Shirt", color: "#60a5fa" },
                { name: "Điện tử/Công nghệ", icon: "Smartphone", color: "#6366f1" },
                { name: "Đồ gia dụng", icon: "Refrigerator", color: "#0891b2" },
                { name: "Mỹ phẩm/Làm đẹp", icon: "Sparkles", color: "#ec4899" },
            ]
        },

        // 3. Di chuyển
        {
            name: "Di chuyển", type: "expense", icon: "Car", color: "#f59e0b", children: [
                { name: "Xăng xe", icon: "Fuel", color: "#d97706" },
                { name: "Bảo dưỡng/Sửa xe", icon: "Wrench", color: "#b45309" },
                { name: "Taxi/Grab", icon: "Bus", color: "#fbbf24" },
                { name: "Gửi xe", icon: "CircleParking", color: "#ca8a04" },
                { name: "Phí cầu đường", icon: "Route", color: "#a16207" },
            ]
        },

        // 4. Nhà cửa
        {
            name: "Nhà cửa", type: "expense", icon: "House", color: "#10b981", children: [
                { name: "Tiền thuê/Trả góp", icon: "Building2", color: "#059669" },
                { name: "Sửa chữa nhà", icon: "Hammer", color: "#047857" },
                { name: "Nội thất/Trang trí", icon: "Lamp", color: "#34d399" },
            ]
        },

        // 5. Hóa đơn & Dịch vụ
        {
            name: "Hóa đơn & Dịch vụ", type: "expense", icon: "Receipt", color: "#06b6d4", children: [
                { name: "Tiền điện", icon: "Zap", color: "#fbbf24" },
                { name: "Tiền nước", icon: "Droplets", color: "#38bdf8" },
                { name: "Internet/TV", icon: "Wifi", color: "#6366f1" },
                { name: "Điện thoại", icon: "Phone", color: "#a855f7" },
                { name: "Gas", icon: "Flame", color: "#f97316" },
            ]
        },

        // 6. Sức khỏe
        {
            name: "Sức khỏe", type: "expense", icon: "Heart", color: "#f43f5e", children: [
                { name: "Khám bệnh", icon: "Stethoscope", color: "#e11d48" },
                { name: "Thuốc", icon: "Pill", color: "#be123c" },
                { name: "Gym/Thể thao", icon: "Dumbbell", color: "#fb923c" },
                { name: "Bảo hiểm y tế", icon: "ShieldPlus", color: "#0d9488" },
            ]
        },

        // 7. Giáo dục
        {
            name: "Giáo dục", type: "expense", icon: "GraduationCap", color: "#6366f1", children: [
                { name: "Học phí", icon: "BookOpen", color: "#818cf8" },
                { name: "Sách/Tài liệu", icon: "BookMarked", color: "#a78bfa" },
                { name: "Khóa học online", icon: "Laptop", color: "#7c3aed" },
            ]
        },

        // 8. Giải trí
        {
            name: "Giải trí", type: "expense", icon: "Gamepad2", color: "#8b5cf6", children: [
                { name: "Xem phim/Ca nhạc", icon: "Film", color: "#a78bfa" },
                { name: "Du lịch", icon: "Plane", color: "#38bdf8" },
                { name: "Game/Ứng dụng", icon: "Joystick", color: "#c084fc" },
                { name: "Sách/Manga", icon: "Library", color: "#d946ef" },
            ]
        },

        // 9. Gia đình & Xã hội
        {
            name: "Gia đình & Xã hội", type: "expense", icon: "Users", color: "#ec4899", children: [
                { name: "Biếu cha mẹ", icon: "HeartHandshake", color: "#f472b6" },
                { name: "Nuôi con", icon: "Baby", color: "#fb7185" },
                { name: "Quà tặng", icon: "Gift", color: "#f9a8d4" },
                { name: "Thú cưng", icon: "Dog", color: "#c084fc" },
                { name: "Từ thiện", icon: "HandHeart", color: "#34d399" },
                { name: "Đám cưới/Đám ma", icon: "PartyPopper", color: "#fbbf24" },
            ]
        },

        // 10. Chi phí Tết
        {
            name: "Chi phí Tết", type: "expense", icon: "Sparkles", color: "#dc2626", children: [
                { name: "Bánh chưng/Mứt/Kẹo", icon: "CakeSlice", color: "#f87171" },
                { name: "Thực phẩm Tết", icon: "Ham", color: "#ef4444" },
                { name: "Quà biếu Tết", icon: "Package", color: "#b91c1c" },
                { name: "Lì xì", icon: "HandCoins", color: "#fbbf24" },
                { name: "Hoa/Cây cảnh", icon: "Flower2", color: "#22c55e" },
                { name: "Quần áo Tết", icon: "Ribbon", color: "#ec4899" },
                { name: "Tiệc tất niên", icon: "PartyPopper", color: "#f97316" },
            ]
        },

        // 11. Chi phí khác
        {
            name: "Chi phí khác", type: "expense", icon: "CircleDollarSign", color: "#78716c", children: [
                { name: "Thuế", icon: "Landmark", color: "#57534e" },
                { name: "Phí ngân hàng", icon: "CreditCard", color: "#a8a29e" },
                { name: "Bảo hiểm", icon: "ShieldCheck", color: "#0d9488" },
                { name: "Phí khác", icon: "ReceiptText", color: "#78716c" },
            ]
        },

        // ═══════════════════════════════════
        // INCOME CATEGORIES
        // ═══════════════════════════════════

        // 1. Lương & Thưởng
        {
            name: "Lương & Thưởng", type: "income", icon: "Briefcase", color: "#22c55e", children: [
                { name: "Lương chính", icon: "Banknote", color: "#4ade80" },
                { name: "Thưởng", icon: "Trophy", color: "#fbbf24" },
                { name: "Phụ cấp", icon: "HandCoins", color: "#34d399" },
                { name: "OT/Tăng ca", icon: "Clock", color: "#86efac" },
            ]
        },

        // 2. Kinh doanh
        {
            name: "Kinh doanh", type: "income", icon: "TrendingUp", color: "#3b82f6", children: [
                { name: "Doanh thu", icon: "BadgeDollarSign", color: "#60a5fa" },
                { name: "Hoa hồng", icon: "Percent", color: "#93c5fd" },
                { name: "Freelance", icon: "Laptop", color: "#818cf8" },
            ]
        },

        // 3. Đầu tư & Tài chính
        {
            name: "Đầu tư & Tài chính", type: "income", icon: "Wallet", color: "#f59e0b", children: [
                { name: "Lãi tiết kiệm", icon: "PiggyBank", color: "#fbbf24" },
                { name: "Cổ tức", icon: "ChartBar", color: "#f97316" },
                { name: "Lãi đầu tư", icon: "TrendingUp", color: "#eab308" },
                { name: "Cho thuê nhà", icon: "House", color: "#d97706" },
            ]
        },

        // 4. Thu nhập Tết
        {
            name: "Thu nhập Tết", type: "income", icon: "Sparkles", color: "#dc2626", children: [
                { name: "Thưởng Tết", icon: "Trophy", color: "#fbbf24" },
                { name: "Lì xì nhận được", icon: "HandCoins", color: "#ef4444" },
                { name: "Bán hàng Tết", icon: "ShoppingBag", color: "#f97316" },
            ]
        },

        // 5. Thu nhập khác
        {
            name: "Thu nhập khác", type: "income", icon: "Coins", color: "#a855f7", children: [
                { name: "Quà được tặng", icon: "Gift", color: "#c084fc" },
                { name: "Bán đồ cũ", icon: "Tag", color: "#d946ef" },
                { name: "Hoàn tiền", icon: "RotateCcw", color: "#e879f9" },
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
