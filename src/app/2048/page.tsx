
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, ArrowLeft } from 'lucide-react';

export default function GameUnavailablePage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Wrench className="text-primary" /> Game Unavailable
          </CardTitle>
          <CardDescription>
            This game is currently undergoing maintenance or has been removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please check back later or explore other games!</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go to Homepage
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
