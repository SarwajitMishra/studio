
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Puzzle as PuzzleIcon, CheckCircle, Shield, Gem, Star, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import NextImage from "next/image"; // Using NextImage for optimized image loading
import { cn } from "@/lib/utils";

type Difficulty = "beginner" | "expert" | "pro";
interface DifficultyOption {
  level: Difficulty;
  label: string;
  Icon: React.ElementType;
  piecesText: string; // Renamed from 'pieces' to avoid confusion
  color: string;
}

const DIFFICULTY_LEVELS: DifficultyOption[] = [
  { level: "beginner", label: "Beginner", Icon: Shield, piecesText: "9 pieces (3x3)", color: "text-green-500" },
  { level: "expert", label: "Expert", Icon: Star, piecesText: "16 pieces (4x4)", color: "text-yellow-500" },
  { level: "pro", label: "Pro", Icon: Gem, piecesText: "25 pieces (5x5)", color: "text-red-500" },
];

interface PuzzleImage {
  src: string;
  alt: string;
  hint: string; // For data-ai-hint
}

// IMPORTANT: Replace these placeholder image paths with your actual image paths.
// Recommended structure: public/images/puzzles/jigsaw/difficulty_level/image_name.png
const PUZZLE_IMAGES_BY_DIFFICULTY: Record<Difficulty, PuzzleImage[]> = {
  beginner: [
    { src: "https://placehold.co/300x200.png?text=Beginner+Img+1", alt: "Beginner Puzzle Image 1", hint: "animal cute" },
    { src: "https://placehold.co/300x200.png?text=Beginner+Img+2", alt: "Beginner Puzzle Image 2", hint: "cartoon fun" },
    { src: "https://placehold.co/300x200.png?text=Beginner+Img+3", alt: "Beginner Puzzle Image 3", hint: "nature simple" },
  ],
  expert: [
    { src: "https://placehold.co/400x300.png?text=Expert+Img+1", alt: "Expert Puzzle Image 1", hint: "landscape scene" },
    { src: "https://placehold.co/400x300.png?text=Expert+Img+2", alt: "Expert Puzzle Image 2", hint: "fantasy world" },
  ],
  pro: [
    { src: "https://placehold.co/500x400.png?text=Pro+Img+1", alt: "Pro Puzzle Image 1", hint: "cityscape detailed" },
    { src: "https://placehold.co/500x400.png?text=Pro+Img+2", alt: "Pro Puzzle Image 2", hint: "abstract complex" },
  ],
};


export default function JigsawPuzzlePage() {
  const [viewMode, setViewMode] = useState<"selectDifficulty" | "selectImage" | "playing">("selectDifficulty");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [availableImagesForDifficulty, setAvailableImagesForDifficulty] = useState<PuzzleImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<PuzzleImage | null>(null);

  const handleDifficultySelect = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setAvailableImagesForDifficulty(PUZZLE_IMAGES_BY_DIFFICULTY[difficulty]);
    setViewMode("selectImage");
  };

  const handleImageSelect = (image: PuzzleImage) => {
    setSelectedImage(image);
    setViewMode("playing");
  };

  const currentDifficultyDetails = selectedDifficulty ? DIFFICULTY_LEVELS.find(d => d.level === selectedDifficulty) : null;

  if (viewMode === "playing" && selectedDifficulty && selectedImage && currentDifficultyDetails) {
    return (
      <>
        <title>{`Jigsaw - ${currentDifficultyDetails.label}: ${selectedImage.alt} | Shravya Playhouse`}</title>
        <meta name="description" content={`Playing Jigsaw Puzzle: ${selectedImage.alt} at ${currentDifficultyDetails.label} level.`} />
        <div className="flex flex-col items-center space-y-6 p-4">
          <Card className="w-full max-w-3xl shadow-xl">
            <CardHeader className="bg-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <PuzzleIcon size={32} className="text-primary" />
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">
                    Jigsaw Puzzle
                  </CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setViewMode("selectImage"); // Go back to image selection
                  // selectedImage remains, so user sees their previous choice highlighted
                }}>
                  <ArrowLeft size={16} className="mr-1 sm:mr-2" /> Change Image
                </Button>
              </div>
              <CardDescription className="text-md sm:text-lg text-foreground/80 pt-2">
                Level: <span className={cn("font-semibold", currentDifficultyDetails.color)}>{currentDifficultyDetails.label}</span>
                {" "}({currentDifficultyDetails.piecesText})
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-lg text-foreground mb-4">
                Solving: <strong>{selectedImage.alt}</strong>
              </p>
              <div className="relative w-full max-w-md mx-auto aspect-[4/3] rounded-md shadow-md overflow-hidden">
                 <NextImage 
                    src={selectedImage.src} 
                    alt={selectedImage.alt} 
                    layout="fill" 
                    objectFit="contain" 
                    data-ai-hint={selectedImage.hint}
                 />
              </div>
              <p className="text-lg text-muted-foreground mt-6">
                (Actual interactive puzzle board and pieces coming soon!)
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (viewMode === "selectImage" && selectedDifficulty && currentDifficultyDetails) {
    return (
      <>
        <title>{`Select Image (${currentDifficultyDetails.label}) | Shravya Playhouse`}</title>
        <meta name="description" content={`Choose a Jigsaw Puzzle image for the ${currentDifficultyDetails.label} level.`} />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
          <Card className="w-full max-w-2xl shadow-xl">
            <CardHeader className="bg-primary/10">
              <div className="flex items-center justify-center space-x-3">
                <ImageIcon size={32} className="text-primary" />
                <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">
                  Choose Image for <span className={cn(currentDifficultyDetails.color)}>{currentDifficultyDetails.label}</span> Level
                </CardTitle>
              </div>
              <CardDescription className="text-center text-lg text-foreground/80 pt-2">
                Pick a puzzle to solve! ({currentDifficultyDetails.piecesText})
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              {availableImagesForDifficulty.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {availableImagesForDifficulty.map((image, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleImageSelect(image)}
                      className={cn(
                        "rounded-lg border-2 p-1 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-accent/50 relative group aspect-video overflow-hidden",
                        selectedImage?.src === image.src ? "border-accent ring-2 ring-accent" : "border-transparent hover:border-primary/50"
                      )}
                      aria-label={`Select puzzle: ${image.alt}`}
                    >
                      <NextImage
                        src={image.src}
                        alt={image.alt}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={image.hint}
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <CheckCircle size={32} className={cn("text-white opacity-0 group-hover:opacity-100 transition-opacity", selectedImage?.src === image.src && "!opacity-100 text-accent")} />
                      </div>
                       <p className="absolute bottom-1 left-1 right-1 p-1 bg-black/50 text-white text-xs rounded-b-md truncate text-center">
                        {image.alt}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No images available for this difficulty level yet.</p>
              )}
              <div className="text-center mt-6">
                <Button variant="outline" onClick={() => setViewMode("selectDifficulty")}>
                  <ArrowLeft size={16} className="mr-2" /> Back to Difficulty Selection
                </Button>
              </div>
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
                      <p className="text-sm text-muted-foreground">{diffOpt.piecesText}</p>
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

