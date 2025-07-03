
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Puzzle as PuzzleIcon, CheckCircle, Shield, Gem, Star, ArrowLeft, Timer, Eye, RotateCw } from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { searchImages } from "../../../services/pixabay";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


type Difficulty = "beginner" | "expert" | "pro";

interface DifficultyOption {
  level: Difficulty;
  label: string;
  Icon: React.ElementType;
  piecesText: string;
  color: string;
  gridSize: number;
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
  correctRow: number;
  correctCol: number;
  // The current position in the grid
  currentRow: number;
  currentCol: number;
}

const DIFFICULTY_LEVELS: DifficultyOption[] = [
  { level: "beginner", label: "Beginner", Icon: Shield, piecesText: "9 pieces (3x3)", color: "text-green-500", gridSize: 3 },
  { level: "expert", label: "Expert", Icon: Star, piecesText: "16 pieces (4x4)", color: "text-yellow-500", gridSize: 4 },
  { level: "pro", label: "Pro", Icon: Gem, piecesText: "25 pieces (5x5)", color: "text-red-500", gridSize: 5 },
];

const PUZZLE_IMAGES_BY_DIFFICULTY: Record<Difficulty, PuzzleImage[]> = {
  beginner: [
    { src: "https://placehold.co/450x450.png", alt: "A cute cartoon animal", hint: "animal cute" },
    { src: "https://placehold.co/450x450.png", alt: "A colorful cartoon landscape", hint: "cartoon fun" },
    { src: "https://placehold.co/450x450.png", alt: "A simple nature scene", hint: "nature simple" },
  ],
  expert: [
    { src: "https://placehold.co/450x450.png", alt: "A beautiful landscape", hint: "landscape beautiful" },
    { src: "https://placehold.co/450x450.png", alt: "A fantasy world illustration", hint: "fantasy world" },
  ],
  pro: [
    { src: "https://placehold.co/450x450.png", alt: "A detailed cityscape", hint: "cityscape detailed" },
    { src: "https://placehold.co/450x450.png", alt: "A complex abstract pattern", hint: "abstract complex" },
  ],
};

const shufflePieces = (pieces: PuzzlePiece[]): PuzzlePiece[] => {
    const shuffled = [...pieces];
    let isSolvable = false;
    // Keep shuffling until the puzzle is not in its solved state initially
    while (!isSolvable) {
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // Update current row and col based on new shuffled index
        const size = Math.sqrt(shuffled.length);
        shuffled.forEach((piece, index) => {
            piece.currentRow = Math.floor(index / size);
            piece.currentCol = index % size;
        });
        // Check if it's not already solved
        if (!shuffled.every(p => p.correctRow === p.currentRow && p.correctCol === p.currentCol)) {
            isSolvable = true;
        }
    }
    return shuffled;
};

// Component to render a single piece of the puzzle
const PuzzlePieceComponent = ({ piece, imageSrc, boardSize, gridSize, onClick, isSelected, isComplete }: {
    piece: PuzzlePiece;
    imageSrc: string;
    boardSize: number;
    gridSize: number;
    onClick: () => void;
    isSelected: boolean;
    isComplete: boolean;
}) => {
    const pieceSize = boardSize / gridSize;
    const backgroundX = piece.correctCol * pieceSize;
    const backgroundY = piece.correctRow * pieceSize;

    return (
        <button
            onClick={onClick}
            disabled={isComplete}
            className={cn(
                "bg-no-repeat border border-primary/30 transition-all duration-200 ease-in-out bg-cover",
                isSelected && "ring-4 ring-yellow-400 z-10 scale-105 shadow-lg",
                isComplete ? "border-green-500" : "cursor-pointer hover:scale-105 hover:shadow-xl",
            )}
            style={{
                width: `${pieceSize}px`,
                height: `${pieceSize}px`,
                backgroundImage: `url(${imageSrc})`,
                backgroundSize: `${boardSize}px ${boardSize}px`,
                backgroundPosition: `-${backgroundX}px -${backgroundY}px`,
            }}
            aria-label={`Puzzle piece, correct position row ${piece.correctRow}, column ${piece.correctCol}`}
        />
    );
};


export default function JigsawPuzzlePage() {
    const [viewMode, setViewMode] = useState<"selectDifficulty" | "selectImage" | "playing">("selectDifficulty");
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
    const [availableImages, setAvailableImages] = useState<PuzzleImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<PuzzleImage | null>(null);
    
    // Game state
    const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([]);
    const [gridSize, setGridSize] = useState(3);
    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [showHint, setShowHint] = useState(false);
    
    const boardRef = useRef<HTMLDivElement>(null);
    const [boardSize, setBoardSize] = useState(450); // Default size

    const { toast } = useToast();

    // Effect to update board size for calculations
    useEffect(() => {
        const updateBoardSize = () => {
            if (boardRef.current) {
                setBoardSize(boardRef.current.offsetWidth);
            }
        };
        updateBoardSize();
        window.addEventListener('resize', updateBoardSize);
        return () => window.removeEventListener('resize', updateBoardSize);
    }, [viewMode]);

    // Timer effect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (viewMode === 'playing' && !isComplete) {
            timer = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [viewMode, isComplete]);


    const handleDifficultySelect = async (difficulty: Difficulty) => {
        const levelConfig = DIFFICULTY_LEVELS.find(d => d.level === difficulty);
        if (!levelConfig) return;

        setSelectedDifficulty(difficulty);
        setGridSize(levelConfig.gridSize);

        const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
        const fallbackImages = PUZZLE_IMAGES_BY_DIFFICULTY[difficulty];
        setAvailableImages(fallbackImages); // Default fallback

        if (!apiKey) {
            console.warn("Pixabay API key not found. Using fallback images.");
            setViewMode("selectImage");
            return;
        }

        const searchQuery = (fallbackImages[0]?.hint || difficulty) + " kids";
        const categoryMap: Record<Difficulty, string> = {
            beginner: "animals",
            expert: "nature",
            pro: "backgrounds",
        };
        const category = categoryMap[difficulty];
        
        try {
            toast({ title: "Fetching Images...", description: "Please wait while we find some cool puzzles." });
            const pixabayImages = await searchImages(searchQuery, apiKey, {
                category: category,
                perPage: 9,
            });

            if (pixabayImages.length > 0) {
                 const mappedImages: PuzzleImage[] = pixabayImages.map((img: any) => ({
                    src: img.largeImageURL, // Use larger images for better quality
                    alt: img.tags,
                    hint: img.tags,
                    width: img.webformatWidth,
                    height: img.webformatHeight,
                }));
                setAvailableImages(mappedImages);
            } else {
                 toast({ variant: "destructive", title: "No Images Found", description: "Could not find images from Pixabay, using defaults." });
            }
        } catch (err) {
            console.error("Error fetching from Pixabay. Falling back to default images.", err);
             toast({ variant: "destructive", title: "API Error", description: "Could not fetch images, using defaults." });
        }

        setViewMode("selectImage");
    };

    const handleImageSelect = (image: PuzzleImage) => {
        if (!selectedDifficulty) return;
        
        // Reset game state
        setTime(0);
        setMoves(0);
        setIsComplete(false);
        setSelectedPieceId(null);
        setSelectedImage(image);

        const generatedPieces: PuzzlePiece[] = [];
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                generatedPieces.push({
                    id: `${row}-${col}`,
                    correctRow: row,
                    correctCol: col,
                    currentRow: row, // Will be updated by shuffle
                    currentCol: col,  // Will be updated by shuffle
                });
            }
        }

        setPuzzlePieces(shufflePieces(generatedPieces));
        setViewMode("playing");
    };

    const checkCompletion = useCallback((currentPieces: PuzzlePiece[]) => {
        const isSolved = currentPieces.every(p => p.correctRow === p.currentRow && p.correctCol === p.currentCol);
        if (isSolved) {
            setIsComplete(true);
        }
    }, []);

    const handlePieceClick = (clickedPieceId: string) => {
        if (isComplete) return;

        if (!selectedPieceId) {
            setSelectedPieceId(clickedPieceId);
        } else if (selectedPieceId === clickedPieceId) {
            setSelectedPieceId(null); // Deselect if the same piece is clicked again
        } else {
            // Swap logic
            const newPieces = [...puzzlePieces];
            const piece1Index = newPieces.findIndex(p => p.id === selectedPieceId);
            const piece2Index = newPieces.findIndex(p => p.id === clickedPieceId);

            if (piece1Index === -1 || piece2Index === -1) return;

            // Swap the currentRow and currentCol properties
            const tempRow = newPieces[piece1Index].currentRow;
            const tempCol = newPieces[piece1Index].currentCol;
            newPieces[piece1Index].currentRow = newPieces[piece2Index].currentRow;
            newPieces[piece1Index].currentCol = newPieces[piece2Index].currentCol;
            newPieces[piece2Index].currentRow = tempRow;
            newPieces[piece2Index].currentCol = tempCol;
            
            // Actually swap their positions in the array for rendering
            [newPieces[piece1Index], newPieces[piece2Index]] = [newPieces[piece2Index], newPieces[piece1Index]];

            setPuzzlePieces(newPieces);
            setSelectedPieceId(null);
            setMoves(m => m + 1);
            checkCompletion(newPieces);
        }
    };
    
    const handleReset = () => {
        setViewMode("selectDifficulty");
        setSelectedDifficulty(null);
        setSelectedImage(null);
        setPuzzlePieces([]);
        setIsComplete(false);
        setMoves(0);
        setTime(0);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // View: Playing
    if (viewMode === "playing" && selectedDifficulty && selectedImage) {
        return (
            <div className="flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 space-y-4">
                 <AlertDialog open={isComplete}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl text-green-600 flex items-center justify-center gap-2">
                           <CheckCircle size={28} /> Puzzle Complete!
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-base pt-2">
                            Congratulations! You solved the puzzle.
                            <br />
                            <strong className="text-lg">Moves: {moves}</strong> | <strong className="text-lg">Time: {formatTime(time)}</strong>
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setViewMode('selectImage')}>Choose New Puzzle</AlertDialogAction>
                        <AlertDialogCancel onClick={handleReset}>Back to Menu</AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Card className="w-full max-w-4xl shadow-lg">
                    <CardHeader className="bg-primary/10 flex flex-row items-center justify-between p-3 sm:p-4">
                        <div>
                            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">Jigsaw Puzzle Fun</CardTitle>
                            <CardDescription className="text-sm sm:text-base text-foreground/80">
                                Difficulty: {selectedDifficulty} ({gridSize}x{gridSize})
                            </CardDescription>
                        </div>
                         <div className="flex items-center space-x-2 sm:space-x-4 text-center">
                            <div className="flex items-center gap-1.5 p-2 rounded-md bg-card border">
                                <Timer size={20} className="text-primary"/>
                                <span className="font-mono font-semibold text-lg">{formatTime(time)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 p-2 rounded-md bg-card border">
                                <span className="text-muted-foreground text-sm">Moves:</span>
                                <span className="font-mono font-semibold text-lg">{moves}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start justify-center gap-4 sm:gap-6">
                        <div className="w-full md:w-auto flex flex-col items-center">
                            <div
                                ref={boardRef}
                                className="grid gap-0.5 sm:gap-1 bg-primary/20 p-1 sm:p-2 rounded-lg shadow-inner w-full max-w-[300px] sm:max-w-[450px]"
                                style={{
                                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                                }}
                            >
                                {puzzlePieces.map(piece => (
                                    <PuzzlePieceComponent
                                        key={piece.id}
                                        piece={piece}
                                        imageSrc={selectedImage.src}
                                        boardSize={boardSize}
                                        gridSize={gridSize}
                                        onClick={() => handlePieceClick(piece.id)}
                                        isSelected={selectedPieceId === piece.id}
                                        isComplete={isComplete}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-row md:flex-col items-center justify-center gap-3 mt-2 md:mt-0">
                           <Button onClick={() => setShowHint(true)} onMouseLeave={() => setShowHint(false)} onTouchEnd={() => setShowHint(false)}>
                                <Eye className="mr-2 h-4 w-4" /> Hint
                           </Button>
                           <Button variant="outline" onClick={() => setViewMode('selectImage')}>
                               <ArrowLeft className="mr-2 h-4 w-4" /> Change Image
                           </Button>
                           <Button variant="destructive" onClick={handleReset}>
                                <RotateCw className="mr-2 h-4 w-4" /> Reset Game
                           </Button>

                            <div className="mt-4 border-2 border-dashed p-2 rounded-lg bg-muted/50">
                                <h3 className="text-sm font-semibold text-center mb-2">Hint Image</h3>
                                <NextImage
                                    src={selectedImage.src}
                                    alt="Hint: Completed puzzle"
                                    width={120}
                                    height={120}
                                    className={cn(
                                        "rounded-md shadow-md transition-opacity duration-300",
                                        showHint ? "opacity-100" : "opacity-30 blur-sm"
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // View: Select Image
    if (viewMode === "selectImage" && selectedDifficulty) {
        return (
            <div className="p-4 sm:p-6">
                <h2 className="text-2xl font-bold text-center mb-6">Choose an Image for Your <span className={cn(DIFFICULTY_LEVELS.find(d => d.level === selectedDifficulty)?.color)}>{selectedDifficulty}</span> Puzzle</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {availableImages.map((img, index) => (
                        <button key={img.src + index} onClick={() => handleImageSelect(img)} className="relative group rounded-lg overflow-hidden shadow-md focus:outline-none focus:ring-4 focus:ring-accent">
                            <NextImage
                                src={img.src}
                                alt={img.alt}
                                width={400}
                                height={400}
                                className="object-cover w-full h-full aspect-square group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 text-white text-xs p-2 text-center truncate">
                                {img.alt}
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

    // View: Select Difficulty (Default)
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
