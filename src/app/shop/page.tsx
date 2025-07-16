
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins, Star, Gift, Puzzle, UserCircle, Ticket, Store } from "lucide-react";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon, LOCAL_STORAGE_S_POINTS_KEY } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { applyRewards } from "@/lib/rewards";

const coinPacks = [
    { name: 'Starter Pack', coins: 100, price: 29, bonus: null, tag: null, tagColor: '' },
    { name: 'Popular Choice', coins: 250, price: 59, bonus: 10, tag: '⭐ Popular', tagColor: 'bg-yellow-400/20 text-yellow-600' },
    { name: 'Value Bundle', coins: 500, price: 99, bonus: 50, tag: '💡 Best Value', tagColor: 'bg-green-400/20 text-green-600' },
    { name: 'Super Saver', coins: 1000, price: 179, bonus: 150, tag: '🔥 Super Deal', tagColor: 'bg-red-400/20 text-red-600' },
];

const redemptionOptions = [
    { name: '1 Scratch Card', points: 2000, value: 'Win 10–100 S-Coins', Icon: Ticket, type: 'scratch-card' },
    { name: 'Unlock Premium Puzzle', points: 5000, value: 'Access exclusive puzzle levels', Icon: Puzzle, type: 'unlock' },
    { name: 'Unlock Avatar / Theme', points: 7500, value: 'Special visual content', Icon: UserCircle, type: 'cosmetic' },
    { name: '₹50 Gift Voucher*', points: 10000, value: 'Amazon/Google Play', Icon: Gift, type: 'voucher' },
    { name: 'Exchange for 100 S-Coins', points: 6000, value: 'Redeem directly for coins', Icon: SCoinsIcon, type: 'exchange', coins: 100 },
    { name: 'Exchange for 250 S-Coins', points: 12000, value: 'Better value', Icon: SCoinsIcon, type: 'exchange', coins: 250 },
];

const getStoredSPoints = (): number => {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(LOCAL_STORAGE_S_POINTS_KEY);
    return stored ? parseInt(stored, 10) : 0;
};

export default function ShopPage() {
    const [userPoints, setUserPoints] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        const updatePoints = () => setUserPoints(getStoredSPoints());
        updatePoints();
        window.addEventListener('storageUpdated', updatePoints);
        return () => window.removeEventListener('storageUpdated', updatePoints);
    }, []);
    
    const handleRedeem = (pointsCost: number, description: string, coinsGained: number = 0) => {
        if (userPoints >= pointsCost) {
            applyRewards(-pointsCost, coinsGained, `Redeemed: ${description}`);
            toast({
                title: 'Redemption Successful!',
                description: `You spent ${pointsCost} S-Points. Enjoy your reward!`,
                className: "bg-green-500 text-white",
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Not Enough S-Points',
                description: 'Play more games to earn the S-Points needed for this reward.',
            });
        }
    };
    
    const handleBuy = (packName: string) => {
        toast({
            title: 'Coming Soon!',
            description: `The payment gateway for the ${packName} is not yet integrated.`
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center py-6 bg-primary/10 rounded-lg shadow">
                <Store size={48} className="mx-auto text-primary" />
                <h1 className="mt-4 text-4xl font-bold text-primary tracking-tight">S-Coin Shop</h1>
                <p className="mt-3 text-lg text-foreground/80 max-w-2xl mx-auto">
                    Use real money to buy S-Coins or redeem your S-Points for valuable rewards!
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Coins className="text-accent" /> Buy S-Coins (with Real Money)</CardTitle>
                    <CardDescription>Use S-Coins to unlock premium puzzles, buy skins, avatars, power-ups, and participate in tournaments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {coinPacks.map(pack => (
                            <Card key={pack.name} className="flex flex-col text-center">
                                <CardHeader className="bg-muted/50">
                                    <h3 className="font-bold text-lg">{pack.name}</h3>
                                    {pack.tag && <Badge className={pack.tagColor}>{pack.tag}</Badge>}
                                </CardHeader>
                                <CardContent className="flex-grow p-4 space-y-2">
                                    <p className="text-4xl font-extrabold flex items-center justify-center gap-1 text-primary">{pack.coins} <SCoinsIcon /></p>
                                    {pack.bonus && <p className="text-sm text-green-600 font-semibold">+{pack.bonus} Bonus</p>}
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => handleBuy(pack.name)}>Buy for ₹{pack.price}</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Star className="text-yellow-400"/> S-Points Redemption (Play to Earn)</CardTitle>
                    <CardDescription>
                        You currently have <strong className="text-accent">{userPoints.toLocaleString()}</strong> S-Points. Use them to get amazing rewards!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Redeem Option</TableHead>
                                <TableHead>Required S-Points</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {redemptionOptions.map(option => (
                                <TableRow key={option.name}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <option.Icon className="h-5 w-5 text-muted-foreground" />
                                        {option.name}
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-semibold flex items-center gap-1">{option.points.toLocaleString()} <SPointsIcon className="text-yellow-400" /></span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{option.value}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            size="sm"
                                            disabled={userPoints < option.points}
                                            onClick={() => handleRedeem(option.points, option.name, option.type === 'exchange' ? option.coins : 0)}
                                        >
                                            Redeem
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <p className="text-xs text-muted-foreground mt-4">*Vouchers & high-value redemptions are manually reviewed and processed.</p>
                </CardContent>
            </Card>
        </div>
    );
}
