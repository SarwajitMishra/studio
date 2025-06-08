
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Puzzle } from "lucide-react";
import Link from "next/link";

// Component metadata can be handled by a parent or layout for client components,
// or you can use a Head component if preferred for client-side metadata.
// For simplicity, we'll rely on a potential parent for dynamic metadata.

export default function JigsawPuzzlePage() {
  return (
    <>
      <title>Jigsaw Puzzles | Shravya Playhouse</title>
      <meta name="description" content="Engage with fun Jigsaw Puzzles. Coming Soon!" />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-center space-x-3">
              <Puzzle size={32} className="text-primary" />
              <CardTitle className="text-3xl font-bold text-primary">Jigsaw Puzzles</CardTitle>
            </div>
            <CardDescription className="text-center text-lg text-foreground/80 pt-2">
              Piece together amazing images!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-xl text-foreground mb-6">
              This game is coming soon! Get ready to solve fun jigsaw puzzles.
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
