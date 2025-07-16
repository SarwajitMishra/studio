'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BarChart3, Loader2 } from "lucide-react";
import { getAllUsers } from '@/lib/users';
import { GAMES } from '@/lib/constants';

interface Stats {
  userCount: number;
  gameCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const userList = await getAllUsers();
        const gameCount = GAMES.filter(g => !g.disabled).length;

        setStats({
          userCount: userList.length,
          gameCount,
        });
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const renderCardContent = (value: number | undefined, description: string) => {
    if (loading) {
      return (
        <div className="h-10 flex items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return (
        <>
            <div className="text-2xl font-bold">{value ?? 'N/A'}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Welcome, Admin!</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {renderCardContent(stats?.userCount, 'Registered users')}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Games</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {renderCardContent(stats?.gameCount, 'Playable games in the app')}
          </CardContent>
        </Card>
      </div>
       <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <p className="text-muted-foreground">Future quick action buttons will go here.</p>
      </div>
    </div>
  );
}
