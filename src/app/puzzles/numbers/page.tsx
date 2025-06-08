
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import Link from "next/link";

// Metadata can be handled by a parent or layout for client components.

export default function NumberPuzzlesPage() {
  return (
    <>
      <title>Number Puzzles | Shravya Playhouse</title>
      <meta name="description" content="Challenge yourself with Number Puzzles. Coming Soon!" />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-center space-x-3">
              <BookOpen size={32} className="text-primary" />
              <CardTitle className="text-3xl font-bold text-primary">Number Puzzles</CardTitle>
            </div>
            <CardDescription className="text-center text-lg text-foreground/80 pt-2">
              Sharpen your mind with math and logic puzzles!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-xl text-foreground mb-6">
              This game is coming soon! Prepare for fun and engaging number challenges.
            </p>
            <Button asChild variant="outline">
              <Link href="/puzzles">Back to Puzzles</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
