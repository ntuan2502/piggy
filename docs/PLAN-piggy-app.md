# PLAN-piggy-app: Ứng dụng Quản lý Tài chính Cá nhân (Piggy)

> **Mục tiêu**: Xây dựng ứng dụng web tài chính cá nhân tập trung vào theo dõi chi tiêu, ngân sách và báo cáo tài chính, lấy cảm hứng từ "Money Lover".
> **Công nghệ**: Next.js 16 (App Router), Tailwind CSS v4, Shadcn UI, Firebase (Auth, Firestore, Storage).

## 1. Bối cảnh Dự án

**Piggy** là công cụ tài chính toàn diện giúp người dùng theo dõi chi tiêu, quản lý ngân sách và trực quan hóa sức khỏe tài chính của họ.

### Giá trị Cốt lõi
- **Đơn giản**: Nhập giao dịch nhanh chóng.
- **Rõ ràng**: Báo cáo trực quan về dòng tiền.
- **Kiểm soát**: Hỗ trợ nhiều ví và ngân sách.

### Tính năng (MVP)
1.  **Xác thực**: Đăng nhập Google & Email/Mật khẩu (Firebase Auth).
2.  **Quản lý Ví**: Tạo nhiều ví (Tiền mặt, Ngân hàng, Thẻ tín dụng).
3.  **Theo dõi Giao dịch**: Ghi chép Thu nhập, Chi tiêu, Nợ/Cho vay với các danh mục.
4.  **Hệ thống Danh mục**: Danh mục phân cấp (Ăn uống, Di chuyển, Lương, v.v.) với biểu tượng.
5.  **Bảng điều khiển (Dashboard)**: Tổng quan tháng, giao dịch gần đây, tổng số dư.
6.  **Báo cáo**: Biểu đồ tròn (Cơ cấu chi tiêu) và Biểu đồ cột (Thu vs Chi).
7.  **Cài đặt**: Tiền tệ, Ngôn ngữ (Tiếng Việt/Anh), Chế độ tối (Dark Mode).

## 2. Kiến trúc Kỹ thuật

### Chi tiết Stack
-   **Framework**: Next.js 16 (App Router)
-   **Ngôn ngữ**: TypeScript
-   **Giao diện (Styling)**: Tailwind CSS v4, Shadcn UI (Components).
-   **Backend/BaaS**: Firebase
    -   **Auth**: Nhà cung cấp xác thực.
    -   **Firestore**: Cơ sở dữ liệu NoSQL lưu dữ liệu người dùng.
    -   **Storage**: Lưu ảnh hóa đơn hoặc avatar.
-   **Quản lý State**: React Context + SWR hoặc TanStack Query (đồng bộ dữ liệu Firebase).
-   **Icons**: Lucide React.

### Cấu trúc Thư mục
```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Route xác thực
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/      # Protected routes (cần đăng nhập)
│   │   ├── layout.tsx    # Khung Dashboard (Sidebar/Nav)
│   │   ├── page.tsx      # Tổng quan
│   │   ├── wallets/      # Quản lý ví
│   │   ├── transactions/ # Lịch sử giao dịch
│   │   └── reports/      # Phân tích/Báo cáo
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # Shadcn primitives (button, card, dialog...)
│   ├── shared/           # Component dùng chung (TransactionItem, WalletCard)
│   ├── forms/            # Các form phức tạp (AddTransactionForm)
│   └── layout/           # Sidebar, Navbar, MobileMenu
├── lib/
│   ├── firebase.ts       # Khởi tạo Firebase
│   ├── utils.ts          # Hàm tiện ích (cn, format tiền tệ)
│   └── constants.ts      # Hằng số toàn app
├── hooks/
│   ├── use-auth.ts       # State xác thực
│   ├── use-wallets.ts    # CRUD Ví
│   └── use-transactions.ts
├── services/             # Hàm gọi Firestore
│   ├── auth.service.ts
│   └── transaction.service.ts
└── types/                # TypeScript definitions
    └── index.ts
```

## 3. Lộ trình Thực hiện

### Giai đoạn 1: Khởi tạo & Nền tảng
- [ ] Khởi tạo dự án Next.js với TypeScript, ESLint, Prettier.
- [ ] Cấu hình Tailwind CSS v4 và cài đặt Shadcn UI.
- [ ] Thiết lập Firebase credentials và khởi tạo app trong `lib/firebase.ts`.
- [ ] Tạo cấu trúc thư mục và cài đặt alias `@/`.

### Giai đoạn 2: Xác thực & Hồ sơ Người dùng
- [ ] Triển khai Authentication Context (`AuthProvider`).
- [ ] Tạo trang Đăng nhập và Đăng ký.
- [ ] Tích hợp Đăng nhập Google.
- [ ] Tạo component `ProtectedRoute` hoặc middleware bảo vệ route.

### Giai đoạn 3: Cấu trúc Dữ liệu Cốt lõi (Ví & Danh mục)
- [ ] Thiết kế Data Model Firestore (`users`, `wallets`, `categories`, `transactions`).
- [ ] Triển khai "Quản lý Ví" (Tạo, Sửa, Xóa, Chuyển tiền).
- [ ] Seed (tạo sẵn) dữ liệu danh mục mặc định (Ăn uống, Mua sắm, Di chuyển).

### Giai đoạn 4: Giao dịch & Dashboard
- [ ] Xây dựng Modal/Form "Thêm Giao dịch".
    -   Chọn Ví, Danh mục, Ngày, Số tiền, Ghi chú.
- [ ] Tạo Layout Dashboard với Sidebar.
- [ ] Hiển thị danh sách Giao dịch gần đây.
- [ ] Hiển thị Tổng số dư tất cả các ví.

### Giai đoạn 5: Báo cáo & Trực quan hóa
- [ ] Tích hợp thư viện biểu đồ (Recharts hoặc tương tự).
- [ ] Tạo Biểu đồ tròn "Chi tiêu tháng này".
- [ ] Tạo Biểu đồ cột "Thu nhập vs Chi tiêu".
- [ ] Triển khai bộ lọc thời gian cho báo cáo.

### Giai đoạn 6: Hoàn thiện & Nâng cao (Sau MVP)
- [ ] **Ngân sách**: Đặt hạn mức chi tiêu cho danh mục.
- [ ] **Giao dịch định kỳ**: Tự động thêm hóa đơn hàng tháng.
- [ ] **Xuất dữ liệu**: Xuất ra CSV/PDF.
- [ ] **PWA**: Cài đặt ứng dụng trên mobile.

## 4. Câu hỏi & Làm rõ
-   *Đồng bộ dữ liệu*: Bạn có cần hỗ trợ offline không (Firestore hỗ trợ một phần mặc định)? -> Không cần
-   *Icons*: Money Lover dùng icon riêng khá đẹp, chúng ta sẽ bắt đầu với Lucide/Phosphor nhé? -> OK

## 5. Bước tiếp theo
1.  Xem lại kế hoạch này.
2.  Chạy lệnh `/create` để bắt đầu khởi tạo dự án.
