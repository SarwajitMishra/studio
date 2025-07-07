"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Route, ArrowRight } from 'lucide-react';

export default function MovedCrosswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Route className="text-primary" /> This Puzzle Has Moved!
          </CardTitle>
          <CardDescription>
            The Crossword Challenge is now part of our Easy English Fun games.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>You can find it under the "Learning" section on the homepage.</p>
          <Button asChild>
            <Link href="/puzzles/easy-english">
              Go to Easy English Puzzles <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
