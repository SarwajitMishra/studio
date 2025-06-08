
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Puzzle as PuzzleIcon, CheckCircle, Shield, Gem, Star } from "lucide-react"; // Renamed Puzzle to PuzzleIcon to avoid conflict
import Link from "next/link";
import { cn } from "@/lib/utils";

type Difficulty = "beginner" | "expert" | "pro";
interface DifficultyOption {
  level: Difficulty;
  label: string;
  Icon: React.ElementType;
  pieces: string;
  color: string;
}

const DIFFICULTY_LEVELS: DifficultyOption[] = [
  { level: "beginner", label: "Beginner", Icon: Shield, pieces: "9 pieces (3x3)", color: "text-green-500" },
  { level: "expert", label: "Expert", Icon: Star, pieces: "16 pieces (4x4)", color: "text-yellow-500" },
  { level: "pro", label: "Pro", Icon: Gem, pieces: "25 pieces (5x5)", color: "text-red-500" },
];

// For now, we'll use a placeholder image path.
// Later, we can implement image selection.
const DEFAULT_PUZZLE_IMAGE_SRC = "https://placehold.co/600x400.png";

export default function JigsawPuzzlePage() {
  const [viewMode, setViewMode] = useState<"selectDifficulty" | "playing">("selectDifficulty");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>(DEFAULT_PUZZLE_IMAGE_SRC); // Later, this can be dynamic

  const handleDifficultySelect = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setViewMode("playing");
    // Here, you could also select a random image or allow image selection
  };

  if (viewMode === "playing" && selectedDifficulty) {
    // This is where the actual Jigsaw game component/logic will go
    return (
      <>
        <title>{`Jigsaw Puzzle - ${selectedDifficulty} | Shravya Playhouse`}</title>
        <meta name="description" content={`Playing Jigsaw Puzzle at ${selectedDifficulty} level.`} />
        <div className="flex flex-col items-center space-y-6 p-4">
          <Card className="w-full max-w-3xl shadow-xl">
            <CardHeader className="bg-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <PuzzleIcon size={32} className="text-primary" />
                  <CardTitle className="text-3xl font-bold text-primary">
                    Jigsaw Puzzle
                  </CardTitle>
                </div>
                <Button variant="outline" onClick={() => {
                  setViewMode("selectDifficulty");
                  setSelectedDifficulty(null);
                }}>
                  Change Difficulty
                </Button>
              </div>
              <CardDescription className="text-lg text-foreground/80 pt-2">
                Level: <span className={cn("font-semibold", DIFFICULTY_LEVELS.find(d => d.level === selectedDifficulty)?.color)}>{selectedDifficulty}</span>
                {" "}({DIFFICULTY_LEVELS.find(d => d.level === selectedDifficulty)?.pieces})
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <p className="text-xl text-foreground mb-4">
                Puzzle board for <strong>{selectedDifficulty}</strong> level with image:
              </p>
              <img src={selectedImage} alt="Puzzle in progress" className="rounded-md shadow-md mx-auto max-w-full h-auto max-h-[400px]" data-ai-hint="nature landscape" />
              <p className="text-lg text-muted-foreground mt-6">
                (Actual interactive puzzle board and pieces coming soon!)
              </p>
              {/* Placeholder for the game board and pieces */}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // viewMode === "selectDifficulty"
  return (
    <>
      <title>Select Jigsaw Puzzle Difficulty | Shravya Playhouse</title>
      <meta name="description" content="Choose your Jigsaw Puzzle difficulty level." />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-center space-x-3">
              <PuzzleIcon size={36} className="text-primary" />
              <CardTitle className="text-3xl font-bold text-primary">Jigsaw Puzzles</CardTitle>
            </div>
            <CardDescription className="text-center text-xl text-foreground/80 pt-3">
              Select your challenge level!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {DIFFICULTY_LEVELS.map((diffOpt) => (
                <Button
                  key={diffOpt.level}
                  variant="outline"
                  className="h-auto py-4 text-left flex flex-col items-start space-y-1 hover:bg-accent/10 group"
                  onClick={() => handleDifficultySelect(diffOpt.level)}
                >
                  <div className="flex items-center w-full">
                    <diffOpt.Icon size={24} className={cn("mr-3 transition-colors duration-200", diffOpt.color, "group-hover:scale-110")} />
                    <div className="flex-grow">
                      <p className={cn("text-lg font-semibold", diffOpt.color)}>{diffOpt.label}</p>
                      <p className="text-sm text-muted-foreground">{diffOpt.pieces}</p>
                    </div>
                    <CheckCircle size={24} className="text-transparent group-hover:text-accent transition-colors duration-200" />
                  </div>
                </Button>
              ))}
            </div>
             <div className="text-center mt-6">
                <Button variant="ghost" asChild>
                  <Link href="/puzzles">Back to All Puzzles</Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
