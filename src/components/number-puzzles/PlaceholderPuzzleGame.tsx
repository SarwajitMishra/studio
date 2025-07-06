
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MathPuzzleType, EnglishPuzzleType } from "@/lib/constants";

// Make props more generic to accept either puzzle type
interface PlaceholderPuzzleGameProps {
  puzzle: MathPuzzleType | EnglishPuzzleType; // Use a union type
  onBack: () => void;
}

export default function PlaceholderPuzzleGame({ puzzle, onBack }: PlaceholderPuzzleGameProps) {
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="bg-primary/10">
         <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <puzzle.Icon size={28} className={cn("text-primary", puzzle.color)} />
              <CardTitle className="text-2xl font-bold text-primary">{puzzle.name}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
        </div>
        <CardDescription className="text-center text-md text-foreground/80 pt-2">
          {puzzle.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 text-center space-y-4">
        <puzzle.Icon size={48} className={cn("mx-auto mb-4 text-muted-foreground", puzzle.color)} />
        <p className="text-xl text-foreground">Get ready for some fun!</p>
        <p className="text-2xl font-semibold text-accent animate-pulse">Coming Soon!</p>
        <Button onClick={onBack} variant="ghost" className="mt-4">
          Choose Another Puzzle
        </Button>
      </CardContent>
    </Card>
  );
}
