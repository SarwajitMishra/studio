
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Coins, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from "react";
import { LOCAL_STORAGE_S_COINS_KEY } from "@/lib/constants";
import { applyRewards } from "@/lib/rewards";
import { useToast } from "@/hooks/use-toast";

const getStoredSCoins = (): number => {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(LOCAL_STORAGE_S_COINS_KEY);
    return stored ? parseInt(stored, 10) : 0;
};

export default function ContestPage() {
  const [userCoins, setUserCoins] = useState(0);
  const entryCost = 1000;
  const { toast } = useToast();

  useEffect(() => {
    // This will only run on the client
    setUserCoins(getStoredSCoins());

    const handleStorageUpdate = () => {
        setUserCoins(getStoredSCoins());
    };

    window.addEventListener('storageUpdated', handleStorageUpdate);
    return () => {
        window.removeEventListener('storageUpdated', handleStorageUpdate);
    };
  }, []);
  
  const handleJoinContest = () => {
    if (userCoins >= entryCost) {
      applyRewards(0, -entryCost, "Monthly Contest Entry");
      
      toast({
        title: "Contest Joined!",
        description: `You've entered the contest. ${entryCost} S-Coins have been deducted. Good luck!`,
        className: "bg-green-500 text-white",
      });
    } else {
        toast({
            variant: 'destructive',
            title: "Not Enough S-Coins",
            description: "You need more S-Coins to enter the contest.",
        });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
            <Ticket size={36} /> Monthly Gifting Contest
          </CardTitle>
          <CardDescription className="text-lg text-foreground/80 pt-2">
            Enter for a chance to win amazing gifts!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="p-4 rounded-lg bg-yellow-100/70 border border-yellow-400/50">
            <h3 className="text-lg font-semibold text-yellow-800">This Month's Theme: Summer Fun!</h3>
            <p className="text-yellow-700 mt-1">Win creative kits, board games, and more!</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-lg">Entry Cost: <span className="text-accent font-bold flex items-center justify-center gap-1">{entryCost} <Coins size={20} /></span></p>
            <p className="text-muted-foreground">You have: <span className="font-bold flex items-center justify-center gap-1">{userCoins} <Coins size={16} /></span></p>
          </div>
          <Button size="lg" className="w-full text-lg" disabled={userCoins < entryCost} onClick={handleJoinContest}>
            {userCoins < entryCost ? "Not Enough S-Coins" : `Join Contest - Spend ${entryCost} S-Coins`}
          </Button>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <p className="text-xs text-muted-foreground">Contest ends on the last day of the month. Winners are announced on the 1st. One entry per user. Entry is non-refundable.</p>
           <Button asChild variant="ghost" className="w-full">
              <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
