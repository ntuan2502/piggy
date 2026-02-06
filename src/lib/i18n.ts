"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
    en: {
        translation: {
            common: {
                dashboard: "Dashboard",
                loading: "Loading...",
                name: "Name",
                save: "Save",
                cancel: "Cancel",
                delete: "Delete",
                actions: "Actions",
                date: "Date",
                amount: "Amount",
                note: "Note",
                settings: "Settings",
                logout: "Logout",
                general: "General",
                tags: "Tags",
                pickDate: "Pick a date",
                confirmDelete: "Are you sure you want to delete this?",
                ok: "OK"
            },
            wallet: {
                title: "Wallets",
                add: "Add Wallet",
                create: "Create Wallet",
                edit: "Edit Wallet",
                active: "Active Wallets",
                totalBalance: "Total Balance",
                name: "Wallet Name",
                initialBalance: "Initial Balance",
                currency: "Currency",
                default: "Default Wallet",
                select: "Select wallet",
                description: "Manage your wallets and accounts",
                setDefaultHelp: "This wallet will be selected by default when adding transactions.",
                placeholderName: "Cash, Bank...",
                delete: "Delete Wallet",
                createSuccess: "Wallet created successfully",
                updateSuccess: "Wallet updated successfully",
                deleteSuccess: "Wallet deleted successfully",
                deleteFailed: "Failed to delete wallet",
                confirmDelete: "Are you sure you want to delete this wallet? This action cannot be undone."
            },
            transaction: {
                add: "Add Transaction",
                recent: "Recent Transactions",
                item: "Transaction",
                income: "Income",
                expense: "Expense",
                debt: "Debt",
                loan: "Loan",
                noRecent: "No recent transactions",
                description: "Record a new income or expense.",
                manage: "Manage Transactions",
                allTransactions: "All Transactions",
                edit: "Edit Transaction",
                delete: "Delete Transaction",
                confirmDelete: "Are you sure you want to delete this transaction? This will adjust your wallet balance.",
                deleteSuccess: "Transaction deleted successfully",
                updateSuccess: "Transaction updated successfully",
                search: "Search transactions...",
                searchPlaceholder: "Search by category, wallet, note...",
                filter: "Filter",
                all: "All",
                noTransactions: "No transactions found"
            },
            category: {
                title: "Categories",
                item: "Category",
                select: "Select category",
                management: "Category Management",
                edit: "Edit Category",
                add: "Add Category",
                parent: "Parent Category",
                name: "Category Name",
                none: "None (Root)",
                seeding: "Seeding...",
                confirmDelete: "Are you sure you want to delete this category?"
            },
            report: {
                title: "Reports",
                overview: "Overview",
                incomeVsExpense: "Income vs Expense",
                monthlyExpense: "Monthly Expense",
                comingSoon: "Charts coming soon (Phase 5)"
            },
            settings: {
                title: "Settings",
                dataManagement: "Data Management",
                resetCategories: "Reset Default Categories (Money Lover style)",
                preferenceDesc: "Manage your general preferences.",
                dataDesc: "Manage your application data."
            },
            theme: {
                light: "Light",
                dark: "Dark",
                system: "System",
                toggle: "Toggle theme",
                lang: "Language"
            }
        }
    },
    vi: {
        translation: {
            common: {
                dashboard: "Trang chủ",
                loading: "Đang tải...",
                name: "Tên",
                save: "Lưu",
                cancel: "Hủy",
                delete: "Xóa",
                actions: "Thao tác",
                date: "Ngày",
                amount: "Số tiền",
                note: "Ghi chú",
                settings: "Cài đặt",
                logout: "Đăng xuất",
                general: "Chung",
                tags: "Thẻ (Tags)",
                pickDate: "Chọn ngày",
                confirmDelete: "Bạn có chắc chắn muốn xóa không?",
                ok: "Đồng ý"
            },
            wallet: {
                title: "Ví tiền",
                add: "Thêm ví mới",
                create: "Tạo ví",
                edit: "Sửa ví",
                active: "Ví đang dùng",
                totalBalance: "Tổng số dư",
                name: "Tên ví",
                initialBalance: "Số dư ban đầu",
                currency: "Đơn vị tiền tệ",
                default: "Ví mặc định",
                select: "Chọn ví",
                description: "Quản lý các tài khoản và ví của bạn",
                setDefaultHelp: "Ví này sẽ được chọn mặc định khi thêm giao dịch.",
                placeholderName: "Tiền mặt, Ngân hàng...",
                delete: "Xóa ví",
                createSuccess: "Đã tạo ví thành công",
                updateSuccess: "Đã cập nhật ví thành công",
                deleteSuccess: "Đã xóa ví thành công",
                deleteFailed: "Xóa ví thất bại",
                confirmDelete: "Bạn có chắc chắn muốn xóa ví này? Hành động này không thể hoàn tác."
            },
            transaction: {
                add: "Thêm giao dịch",
                recent: "Giao dịch gần đây",
                item: "Giao dịch",
                income: "Thu nhập",
                expense: "Chi tiêu",
                debt: "Đi vay",
                loan: "Cho vay",
                noRecent: "Chưa có giao dịch nào",
                description: "Ghi lại thu nhập hoặc chi tiêu mới.",
                manage: "Quản lý giao dịch",
                allTransactions: "Tất cả giao dịch",
                edit: "Sửa giao dịch",
                delete: "Xóa giao dịch",
                confirmDelete: "Bạn có chắc muốn xóa giao dịch này? Số dư ví sẽ được điều chỉnh.",
                deleteSuccess: "Đã xóa giao dịch",
                updateSuccess: "Đã cập nhật giao dịch",
                search: "Tìm kiếm giao dịch...",
                searchPlaceholder: "Tìm theo danh mục, ví, ghi chú...",
                filter: "Lọc",
                all: "Tất cả",
                noTransactions: "Không tìm thấy giao dịch nào"
            },
            category: {
                title: "Danh mục",
                item: "Danh mục",
                select: "Chọn danh mục",
                management: "Quản lý danh mục",
                edit: "Sửa danh mục",
                add: "Thêm danh mục",
                parent: "Danh mục cha",
                name: "Tên danh mục",
                none: "Không (Gốc)",
                seeding: "Đang tạo dữ liệu...",
                confirmDelete: "Bạn có chắc muốn xóa danh mục này?"
            },
            report: {
                title: "Báo cáo",
                overview: "Tổng hợp",
                incomeVsExpense: "Thu nhập vs Chi tiêu",
                monthlyExpense: "Chi tiêu hàng tháng",
                comingSoon: "Biểu đồ sẽ sớm ra mắt (Giai đoạn 5)"
            },
            settings: {
                title: "Cài đặt",
                dataManagement: "Quản lý dữ liệu",
                resetCategories: "Khôi phục danh mục mẫu (Kiểu Money Lover)",
                preferenceDesc: "Quản lý các thiết lập chung.",
                dataDesc: "Quản lý dữ liệu ứng dụng."
            },
            theme: {
                light: "Sáng",
                dark: "Tối",
                system: "Hệ thống",
                toggle: "Đổi giao diện",
                lang: "Ngôn ngữ"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
