
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Puzzle as PuzzleIcon, CheckCircle, Shield, Gem, Star, ArrowLeft, Timer, Eye, RotateCw, Loader2, Lightbulb } from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { searchImages } from "@/services/pixabay";
import { useToast } from "@/hooks/use-toast";
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { updateGameStats } from "@/lib/progress";
import { S_COINS_ICON as SCoinsIcon, S_POINTS_ICON as SPointsIcon } from '@/lib/constants';

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
  src?: string; // Now optional, will be fetched
  alt: string;
  hint: string;
}

interface PuzzlePiece {
  id: string;
  correctRow: number;
  correctCol: number;
}

const DIFFICULTY_LEVELS: DifficultyOption[] = [
  { level: "beginner", label: "Beginner", Icon: Shield, piecesText: "9 pieces (3x3)", color: "text-green-500", gridSize: 3 },
  { level: "expert", label: "Expert", Icon: Star, piecesText: "16 pieces (4x4)", color: "text-yellow-500", gridSize: 4 },
  { level: "pro", label: "Pro", Icon: Gem, piecesText: "25 pieces (5x5)", color: "text-red-500", gridSize: 5 },
];

const PUZZLE_IMAGES_BY_DIFFICULTY: Record<Difficulty, PuzzleImage[]> = {
  beginner: [
    { alt: "A smiling cartoon sun in a pastel sky", hint: "cartoon sun" },
    { alt: "A friendly cartoon lion in a jungle", hint: "cartoon lion" },
    { alt: "A colorful butterfly on a flower", hint: "butterfly flower" },
  ],
  expert: [
    { alt: "A magical forest with glowing mushrooms", hint: "enchanted forest" },
    { alt: "A playful dolphin jumping in the ocean", hint: "cartoon dolphin" },
    { alt: "A vibrant cartoon farm with animals", hint: "cartoon farm" },
  ],
  pro: [
    { alt: "An underwater castle with colorful fish", hint: "underwater castle" },
    { alt: "A bustling cartoon city with funny cars", hint: "cartoon city" },
    { alt: "A whimsical treehouse in a fantasy forest", hint: "fantasy treehouse" },
  ],
};

const shufflePieces = (pieces: PuzzlePiece[], gridSize: number): PuzzlePiece[] => {
    const shuffled = [...pieces];
    let isSolvable = false;
    // Keep shuffling until the puzzle is not in its solved state initially
    while (!isSolvable) {
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // Check if it's not already solved
        if (!shuffled.every((p, index) => p.correctRow === Math.floor(index / gridSize) && p.correctCol === index % gridSize)) {
            isSolvable = true;
        }
    }
    return shuffled;
};

// Component to render a single piece of the puzzle
const PuzzlePieceComponent = ({ piece, imageSrc, boardSize, gridSize, onClick, isSelected, isComplete, onDragStart, onDragOver, onDrop }: {
    piece: PuzzlePiece;
    imageSrc: string;
    boardSize: number;
    gridSize: number;
    onClick: () => void;
    isSelected: boolean;
    isComplete: boolean;
    onDragStart: (e: React.DragEvent<HTMLButtonElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLButtonElement>) => void;
    onDrop: (e: React.DragEvent<HTMLButtonElement>) => void;
}) => {
    const pieceSize = boardSize / gridSize;
    const backgroundX = piece.correctCol * pieceSize;
    const backgroundY = piece.correctRow * pieceSize;

    return (
        <button
            onClick={onClick}
            draggable={!isComplete}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
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
    const [fetchedImages, setFetchedImages] = useState<PuzzleImage[]>([]);
    const [areImagesLoading, setAreImagesLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<PuzzleImage | null>(null);
    
    // Game state
    const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([]);
    const [gridSize, setGridSize] = useState(3);
    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [isCalculatingReward, setIsCalculatingReward] = useState(false);
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [hintsRemaining, setHintsRemaining] = useState(3);
    const { toast } = useToast();
    
    const boardRef = useRef<HTMLDivElement>(null);
    const [boardSize, setBoardSize] = useState(450); // Default size

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
    
    const handleWin = useCallback(async () => {
        if (!selectedDifficulty) return;
        setIsComplete(true);
        setIsCalculatingReward(true);
        updateGameStats({ gameId: 'jigsaw', didWin: true, score: 10000 - time * 10 - moves });

        try {
            const rewards = await calculateRewards({
                gameId: 'jigsaw',
                difficulty: selectedDifficulty,
                performanceMetrics: { timeInSeconds: time, moves },
            });
            const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Solved Jigsaw (${selectedDifficulty})`);
            
            toast({
                title: "Puzzle Complete!",
                description: `You earned ${earned.points} S-Points and ${earned.coins} S-Coins!`,
                className: "bg-green-600 border-green-700 text-white",
                duration: 5000,
            });
        } catch (error) {
             console.error("Error calculating rewards:", error);
             toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
        } finally {
            setIsCalculatingReward(false);
        }
    }, [selectedDifficulty, time, moves, toast]);

    const checkCompletion = useCallback((currentPieces: PuzzlePiece[]) => {
        const isSolved = currentPieces.every((p, index) => {
            const currentRow = Math.floor(index / gridSize);
            const currentCol = index % gridSize;
            return p.correctRow === currentRow && p.correctCol === currentCol;
        });
        if (isSolved) {
            handleWin();
        }
    }, [gridSize, handleWin]);


    const handleDifficultySelect = (difficulty: Difficulty) => {
        const levelConfig = DIFFICULTY_LEVELS.find(d => d.level === difficulty);
        if (!levelConfig) return;

        setSelectedDifficulty(difficulty);
        setGridSize(levelConfig.gridSize);
        setViewMode("selectImage");
        setAreImagesLoading(true);

        const fetchAllImages = async () => {
            const imagesForDifficulty = PUZZLE_IMAGES_BY_DIFFICULTY[difficulty];
            const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;

            if (!apiKey) {
                console.warn("Pixabay API key missing, using placeholders for Jigsaw.");
                const placeholderImages = imagesForDifficulty.map(img => ({ ...img, src: `https://placehold.co/400x400.png?text=${img.hint.replace(/\s/g,'+')}`}));
                setFetchedImages(placeholderImages);
                setAreImagesLoading(false);
                return;
            }

            const imagePromises = imagesForDifficulty.map(async (img) => {
                const results = await searchImages(img.hint, apiKey, { perPage: 3 });
                if (results.length > 0) {
                    return { ...img, src: results[0].largeImageURL };
                }
                return { ...img, src: `https://placehold.co/400x400.png?text=Not+Found` }; 
            });

            const newImages = await Promise.all(imagePromises);
            setFetchedImages(newImages);
            setAreImagesLoading(false);
        };

        fetchAllImages();
    };

    const handleImageSelect = (image: PuzzleImage) => {
        if (!selectedDifficulty || !image.src) return;
        
        setTime(0);
        setMoves(0);
        setIsComplete(false);
        setSelectedPieceId(null);
        setSelectedImage(image);
        setHintsRemaining(3);

        const generatedPieces: PuzzlePiece[] = [];
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                generatedPieces.push({
                    id: `${row}-${col}`,
                    correctRow: row,
                    correctCol: col,
                });
            }
        }

        setPuzzlePieces(shufflePieces(generatedPieces, gridSize));
        setViewMode("playing");
    };

    const swapPieces = useCallback((piece1Id: string, piece2Id: string) => {
        const newPieces = [...puzzlePieces];
        const piece1Index = newPieces.findIndex(p => p.id === piece1Id);
        const piece2Index = newPieces.findIndex(p => p.id === piece2Id);

        if (piece1Index === -1 || piece2Index === -1) return;
        
        [newPieces[piece1Index], newPieces[piece2Index]] = [newPieces[piece2Index], newPieces[piece1Index]];

        setPuzzlePieces(newPieces);
        setMoves(m => m + 1);
        checkCompletion(newPieces);
    }, [puzzlePieces, checkCompletion]);

    const handlePieceClick = (clickedPieceId: string) => {
        if (isComplete) return;

        if (!selectedPieceId) {
            setSelectedPieceId(clickedPieceId);
        } else if (selectedPieceId === clickedPieceId) {
            setSelectedPieceId(null);
        } else {
            swapPieces(selectedPieceId, clickedPieceId);
            setSelectedPieceId(null);
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, pieceId: string) => {
        e.dataTransfer.setData("application/jigsaw-piece", pieceId);
        e.dataTransfer.effectAllowed = "move";
        if (selectedPieceId) {
            setSelectedPieceId(null);
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
        e.preventDefault();
    };
    
    const handleDrop = (e: React.DragEvent<HTMLButtonElement>, droppedOnPieceId: string) => {
        e.preventDefault();
        const draggedPieceId = e.dataTransfer.getData("application/jigsaw-piece");
        if (draggedPieceId && draggedPieceId !== droppedOnPieceId) {
            swapPieces(draggedPieceId, droppedOnPieceId);
        }
    };
    
    const handleReset = () => {
        updateGameStats({ gameId: 'jigsaw', didWin: false });
        setViewMode("selectDifficulty");
        setSelectedDifficulty(null);
        setSelectedImage(null);
        setPuzzlePieces([]);
        setIsComplete(false);
        setMoves(0);
        setTime(0);
        setHintsRemaining(3);
    };

    const handleHint = () => {
        if (isComplete || hintsRemaining <= 0) return;
    
        const incorrectPieceIndex = puzzlePieces.findIndex((p, index) => {
            const currentRow = Math.floor(index / gridSize);
            const currentCol = index % gridSize;
            return p.correctRow !== currentRow || p.correctCol !== currentCol;
        });
    
        if (incorrectPieceIndex === -1) return;
    
        const pieceToMove = puzzlePieces[incorrectPieceIndex];
        const correctIndex = pieceToMove.correctRow * gridSize + pieceToMove.correctCol;
        
        const newPieces = [...puzzlePieces];
        [newPieces[incorrectPieceIndex], newPieces[correctIndex]] = [newPieces[correctIndex], newPieces[incorrectPieceIndex]];
    
        setPuzzlePieces(newPieces);
        setHintsRemaining(h => h - 1);
        setMoves(m => m + 1);
        toast({
            title: "Hint Used!",
            description: `A piece has been placed correctly! You have ${hintsRemaining - 1} hints left.`
        });
        checkCompletion(newPieces);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // View: Playing
    if (viewMode === "playing" && selectedDifficulty && selectedImage && selectedImage.src) {
        return (
            <div className="flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 space-y-4">
                 <AlertDialog open={isComplete}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl text-green-600 flex items-center justify-center gap-2">
                           <CheckCircle size={28} /> Puzzle Complete!
                        </AlertDialogTitle>
                         {isCalculatingReward ? (
                             <div className="flex flex-col items-center justify-center gap-2 pt-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Calculating your awesome rewards...</p>
                            </div>
                         ) : (
                            <AlertDialogDescription className="text-center text-base pt-2">
                                Congratulations! You solved the puzzle.
                                <br />
                                <strong className="text-lg">Moves: {moves}</strong> | <strong className="text-lg">Time: {formatTime(time)}</strong>
                            </AlertDialogDescription>
                         )}
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogAction onClick={() => {
                          setViewMode('selectImage');
                          handleDifficultySelect(selectedDifficulty);
                        }} disabled={isCalculatingReward}>Choose New Puzzle</AlertDialogAction>
                        <AlertDialogCancel onClick={handleReset} disabled={isCalculatingReward}>Back to Menu</AlertDialogCancel>
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
                                {puzzlePieces.map((piece, index) => (
                                    <PuzzlePieceComponent
                                        key={piece.id}
                                        piece={piece}
                                        imageSrc={selectedImage.src!}
                                        boardSize={boardSize}
                                        gridSize={gridSize}
                                        onClick={() => handlePieceClick(piece.id)}
                                        isSelected={selectedPieceId === piece.id}
                                        isComplete={isComplete}
                                        onDragStart={(e) => handleDragStart(e, piece.id)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, piece.id)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-row md:flex-col items-center justify-center gap-3 mt-2 md:mt-0">
                           <Button onClick={() => setShowHint(true)} onMouseLeave={() => setShowHint(false)} onTouchEnd={() => setShowHint(false)}>
                                <Eye className="mr-2 h-4 w-4" /> Peek
                           </Button>
                           <Button onClick={handleHint} disabled={isComplete || hintsRemaining <= 0}>
                                <Lightbulb className="mr-2 h-4 w-4" /> Solve Piece ({hintsRemaining})
                           </Button>
                           <Button variant="outline" onClick={() => {
                             setViewMode('selectImage');
                             handleDifficultySelect(selectedDifficulty);
                            }}>
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
                                    data-ai-hint={selectedImage.hint}
                                    className={cn(
                                        "rounded-md shadow-md transition-opacity duration-300",
                                        showHint ? "opacity-100" : "opacity-30 blur-sm"
                                    )}
                                    unoptimized
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
                    {areImagesLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="bg-muted w-full aspect-square flex items-center justify-center rounded-lg shadow-md">
                            <Loader2 className="animate-spin text-primary h-8 w-8" />
                          </div>
                        ))
                    ) : (
                        fetchedImages.map((img, index) => (
                            <button key={img.hint + index} onClick={() => handleImageSelect(img)} className="relative group rounded-lg overflow-hidden shadow-md focus:outline-none focus:ring-4 focus:ring-accent" disabled={!img.src}>
                                <NextImage
                                    src={img.src!}
                                    alt={img.alt}
                                    width={400}
                                    height={400}
                                    data-ai-hint={img.hint}
                                    className="object-cover w-full h-full aspect-square group-hover:scale-105 transition-transform duration-300"
                                    unoptimized
                                />
                            </button>
                        ))
                    )}
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
