"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Puzzle as PuzzleIcon, CheckCircle, Shield, Gem, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import NextImage from "next/image"; // Optimized loading
import { cn } from "@/lib/utils";
import { searchImages } from "../../../services/pixabay";

type Difficulty = "beginner" | "expert" | "pro";

interface DifficultyOption {
  level: Difficulty;
  label: string;
  Icon: React.ElementType;
  piecesText: string;
  color: string;
}

interface PuzzleImage {
  src: string;
  alt: string;
  hint: string;
  width?: number;
  height?: number;
}

interface PuzzlePiece {
  id: string;
  src: string;
  correctRow: number;
  correctCol: number;
  currentRow: number;
  currentCol: number;
}

const DIFFICULTY_LEVELS: DifficultyOption[] = [
  { level: "beginner", label: "Beginner", Icon: Shield, piecesText: "9 pieces (3x3)", color: "text-green-500" },
  { level: "expert", label: "Expert", Icon: Star, piecesText: "16 pieces (4x4)", color: "text-yellow-500" },
  { level: "pro", label: "Pro", Icon: Gem, piecesText: "25 pieces (5x5)", color: "text-red-500" },
];

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

const shufflePieces = (pieces: PuzzlePiece[]): PuzzlePiece[] => {
  const shuffled = [...pieces];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // After shuffling, update currentRow and currentCol
  const size = Math.sqrt(shuffled.length);
  shuffled.forEach((piece, index) => {
    piece.currentRow = Math.floor(index / size);
    piece.currentCol = index % size;
  });

  return shuffled;
};

export default function JigsawPuzzlePage() {
  const [viewMode, setViewMode] = useState<"selectDifficulty" | "selectImage" | "playing">("selectDifficulty");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [availableImagesForDifficulty, setAvailableImagesForDifficulty] = useState<PuzzleImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<PuzzleImage | null>(null);
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([]);

  const handleDifficultySelect = async (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);

    const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
    const fallbackImages = PUZZLE_IMAGES_BY_DIFFICULTY[difficulty];
    setAvailableImagesForDifficulty(fallbackImages); // Default fallback

    if (!apiKey) {
      console.warn("Pixabay API key not found. Using fallback images.");
      setViewMode("selectImage");
      return;
    }

    const searchQuery = (fallbackImages[0]?.hint || difficulty) + " for kids";
    const categoryMap: Record<Difficulty, string> = {
      beginner: "animals",
      expert: "nature",
      pro: "places",
    };
    const category = categoryMap[difficulty];

    try {
      const pixabayImages = await searchImages(searchQuery, apiKey, {
        category: category,
        perPage: 50,
      });
      
      const mappedImages: PuzzleImage[] = pixabayImages.map((img: any) => ({
        src: img.webformatURL,
        alt: img.tags,
        width: img.webformatWidth,
        height: img.webformatHeight,
      }));
      setAvailableImagesForDifficulty(mappedImages);
    } catch (err) {
      console.error("Error fetching from Pixabay. Falling back to default images.", err);
    }

    setViewMode("selectImage");
  };

  const handleImageSelect = (image: PuzzleImage) => {
    if (!selectedDifficulty) return;

    setSelectedImage(image);
    let piecesPerRow = selectedDifficulty === "beginner" ? 3 : selectedDifficulty === "expert" ? 4 : 5;

    const generatedPieces: PuzzlePiece[] = [];
    for (let row = 0; row < piecesPerRow; row++) {
      for (let col = 0; col < piecesPerRow; col++) {
        generatedPieces.push({
          id: `${row}-${col}`,
          src: image.src,
          correctRow: row,
          correctCol: col,
          currentRow: row,
          currentCol: col,
        });
      }
    }

    const shuffledPieces = shufflePieces(generatedPieces);
    setPuzzlePieces(shuffledPieces);
    setViewMode("playing");
  };

  // View: Playing (Placeholder)
  if (viewMode === "playing" && selectedDifficulty && selectedImage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6">
        <h2 className="text-2xl font-bold text-primary mb-4">Puzzle Play (Coming Soon)</h2>
        <NextImage src={selectedImage.src} alt={selectedImage.alt} width={300} height={200} />
        <p className="text-muted-foreground mt-2">You selected: {selectedDifficulty.toUpperCase()}</p>
        <Button className="mt-4" onClick={() => setViewMode("selectDifficulty")}>
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
      </div>
    );
  }

  // View: Select Image
  if (viewMode === "selectImage" && selectedDifficulty) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Choose an Image for Your Puzzle</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {availableImagesForDifficulty.map((img, index) => (
            <button key={index} onClick={() => handleImageSelect(img)} className="relative group">
              <NextImage
                src={img.src}
                alt={img.alt}
                width={img.width || 300}
                height={img.height || 200}
                className="rounded-lg shadow-md group-hover:scale-105 transition-transform"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                {img.hint}
              </div>
            </button>
          ))}
        </div>
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => setViewMode("selectDifficulty")}>
            <ArrowLeft size={16} className="mr-2" /> Back to Difficulty
          </Button>
        </div>
      </div>
    );
  }

  // View: Select Difficulty
  return (
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
                  <diffOpt.Icon
                    size={24}
                    className={cn("mr-3 transition-transform duration-200", diffOpt.color, "group-hover:scale-110")}
                  />
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
  );
}
