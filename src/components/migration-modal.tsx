"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallets } from "@/hooks/use-wallets";
import { db } from "@/lib/firebase";
import { updateDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function MigrationModal() {
    const { user } = useAuth();
    const { wallets, loading } = useWallets();
    const [open, setOpen] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [needsMigration, setNeedsMigration] = useState(false);

    useEffect(() => {
        if (loading || !wallets.length) return;

        // Check if any wallet needs migration (missing type field)
        const walletsNeedingMigration = wallets.filter(w => !w.type);

        if (walletsNeedingMigration.length > 0) {
            setNeedsMigration(true);
            setOpen(true);
        }
    }, [wallets, loading]);

    const handleMigrate = async () => {
        if (!user) return;

        setIsMigrating(true);
        try {
            let updated = 0;

            for (const wallet of wallets) {
                if (!wallet.type) {
                    await updateDoc(doc(db, "wallets", wallet.id), {
                        type: "available"
                    });
                    updated++;
                }
            }

            toast.success(`Đã cập nhật ${updated} ví thành công!`);
            setOpen(false);
            setNeedsMigration(false);
        } catch (error) {
            console.error("Migration failed:", error);
            toast.error("Migration thất bại. Vui lòng thử lại.");
        } finally {
            setIsMigrating(false);
        }
    };

    if (!needsMigration) return null;

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <DialogTitle className="text-xl">Cập nhật quan trọng!</DialogTitle>
                    </div>
                    <DialogDescription className="pt-4 space-y-3 text-base">
                        <p>
                            Piggy đã có tính năng mới: <strong>Phân loại ví</strong>
                        </p>
                        <p>
                            Giờ bạn có thể tách riêng:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>Tiền có sẵn</strong> (tiền mặt, ngân hàng)</li>
                            <li><strong>Tài khoản tín dụng</strong> (thẻ tín dụng)</li>
                        </ul>
                        <p className="pt-2">
                            Để sử dụng tính năng này, chúng tôi cần cập nhật {wallets.filter(w => !w.type).length} ví hiện tại của bạn.
                        </p>
                        <div className="p-3 bg-muted rounded-lg text-sm">
                            <p className="font-medium mb-1">Điều gì sẽ xảy ra:</p>
                            <ul className="space-y-1 text-muted-foreground">
                                <li>✓ Tất cả ví sẽ được đặt thành &quot;Tiền có sẵn&quot;</li>
                                <li>✓ Bạn có thể thay đổi loại ví sau</li>
                                <li>✓ Quá trình an toàn, không mất dữ liệu</li>
                            </ul>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center">
                    <Button
                        onClick={handleMigrate}
                        disabled={isMigrating}
                        size="lg"
                        className="w-full sm:w-auto"
                    >
                        {isMigrating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang cập nhật...
                            </>
                        ) : (
                            'Cập nhật ngay'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
