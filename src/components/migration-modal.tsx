"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
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
            for (const wallet of wallets) {
                if (!wallet.type) {
                    await updateDoc(doc(db, "wallets", wallet.id), {
                        type: "available"
                    });
                }
            }

            toast.success(t('migration.success'));
            setOpen(false);
            setNeedsMigration(false);
        } catch (error) {
            console.error("Migration failed:", error);
            toast.error(t('migration.error'));
        } finally {
            setIsMigrating(false);
        }
    };

    if (!needsMigration) return null;

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <DialogTitle className="text-xl">{t('migration.title')}</DialogTitle>
                    </div>
                    <DialogDescription className="pt-4 space-y-3 text-base">
                        <p>{t('migration.description')}</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>{t('wallet.typeAvailable')}</strong></li>
                            <li><strong>{t('wallet.typeCredit')}</strong></li>
                        </ul>
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
                                {t('migration.migrating')}
                            </>
                        ) : (
                            t('migration.start')
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
