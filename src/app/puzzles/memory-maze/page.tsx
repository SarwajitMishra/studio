
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Route, ArrowRight } from 'lucide-react';

export default function MovedMemoryMazePage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Route className="text-primary" /> This Puzzle Has Moved!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>The Memory Maze game is now part of our Strategy Games section.</p>
          <Button asChild>
            <Link href="/memory-maze">
              Go to Memory Maze <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
