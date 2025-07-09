
"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Cloud, HardDrive, Loader2 } from "lucide-react";

interface SyncDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeepOnline: () => void;
  onKeepLocal: () => void;
  isSyncing: boolean;
}

export default function SyncDataDialog({
  open,
  onOpenChange,
  onKeepOnline,
  onKeepLocal,
  isSyncing,
}: SyncDataDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sync Your Progress?</AlertDialogTitle>
          <AlertDialogDescription>
            We found saved progress on this device. Choose which data you want to keep. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center justify-center gap-2 text-base text-center"
                onClick={onKeepOnline}
                disabled={isSyncing}
            >
                <Cloud className="h-8 w-8 text-blue-500" />
                <span className="font-semibold">Keep Online Data</span>
                <span className="text-xs font-normal text-muted-foreground">Your cloud save will be used. Local data on this device will be deleted.</span>
            </Button>
            <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center justify-center gap-2 text-base text-center"
                onClick={onKeepLocal}
                disabled={isSyncing}
            >
                <HardDrive className="h-8 w-8 text-green-500" />
                <span className="font-semibold">Use Local Data</span>
                <span className="text-xs font-normal text-muted-foreground">Your online save will be overwritten with the data from this device.</span>
            </Button>
        </div>
        <AlertDialogFooter>
            {isSyncing ? (
                <div className="flex items-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing... Please wait.
                </div>
            ) : (
                <AlertDialogCancel>Cancel Login</AlertDialogCancel>
            )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
