
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookMarked, ArrowLeft, Lightbulb, Sparkles, XCircle, CheckCircle, RotateCcw, HelpCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { searchImages } from "../../../services/pixabay";

interface PuzzleItemBase {
  id: string;
  imageSrc: string;
  imageAlt: string;
  hint: string;
}

interface WordMatchPuzzle extends PuzzleItemBase {
  type: "matchWord";
  correctWord: string;
  options: string[]; // Full words
}

interface MissingLetterPuzzle extends PuzzleItemBase {
  type: "missingLetter";
  wordPattern: string; // e.g., "App_e" or "B_ll"
  correctLetter: string; // The letter that fills the blank
  options: string[]; // Letter choices, including the correctLetter
  fullWord: string; // The full word for display in feedback
}

type PuzzleItem = WordMatchPuzzle | MissingLetterPuzzle;

const PUZZLE_DATA: PuzzleItem[] = [
  {
    id: "1",
    type: "matchWord",
    imageSrc: "https://placehold.co/300x200.png",
    imageAlt: "An apple",
    correctWord: "Apple",
    options: ["Apple", "Banana", "Carrot"],
    hint: "fruit red",
  },
  {
    id: "2",
    type: "matchWord",
    imageSrc: "https://placehold.co/300x200.png",
    imageAlt: "A ball",
    correctWord: "Ball",
    options: ["Ball", "Box", "Book"],
    hint: "toy round",
  },
  {
    id: "3",
    type: "matchWord",
    imageSrc: "https://placehold.co/300x200.png",
    imageAlt: "A cat",
    correctWord: "Cat",
    options: ["Cat", "Dog", "Car"],
    hint: "animal pet",
  },
  {
    id: "ml1",
    type: "missingLetter",
    imageSrc: "https://placehold.co/300x200.png",
    imageAlt: "A dog",
    wordPattern: "D _ G",
    correctLetter: "O",
    options: ["A", "O", "U"],
    fullWord: "DOG",
    hint: "animal barks",
  },
  {
    id: "ml2",
    type: "missingLetter",
    imageSrc: "https://placehold.co/300x200.png",
    imageAlt: "The sun",
    wordPattern: "S _ N",
    correctLetter: "U",
    options: ["A", "U", "I"],
    fullWord: "SUN",
    hint: "sky bright yellow",
  },
  {
    id: "4",
    type: "matchWord",
    imageSrc: "https://placehold.co/300x200.png",
    imageAlt: "A dog",
    correctWord: "Dog",
    options: ["Dog", "Duck", "Door"],
    hint: "animal bark",
  },
  {
    id: "5",
    type: "matchWord",
    imageSrc: "https://placehold.co/300x200.png",
    imageAlt: "A sun",
    correctWord: "Sun",
    options: ["Sun", "Star", "Moon"],
    hint: "sky bright",
  },
  {
    id: "ml3",
    type: "missingLetter",
    imageSrc: "https://placehold.co/300x200.png",
    imageAlt: "A bed",
    wordPattern: "B _ D",
    correctLetter: "E",
    options: ["A", "E", "I"],
    fullWord: "BED",
    hint: "sleep furniture",
  },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const HeadMetadata = () => {
  return (
    <>
      <title>Easy English Fun | Shravya Playhouse</title>
      <meta name="description" content="Learn basic English words by matching them to pictures or filling in missing letters!" />
    </>
  );
};

export default function EasyEnglishPuzzlePage() {
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleItem | null>(null);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [feedback, setFeedback] = useState<{ message: string; type: "correct" | "incorrect" | "info" } | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const { toast } = useToast();

  const MAX_QUESTIONS = 5;

  const loadNextPuzzle = useCallback(async () => {
    if (questionsAnswered >= MAX_QUESTIONS) {
      setFeedback({ message: `Game Over! Your final score: ${score}/${MAX_QUESTIONS}`, type: "info" });
      setCurrentPuzzle(null);
      return;
    }

    const currentPuzzleIdToAvoid = currentPuzzle ? currentPuzzle.id : null;
    const availablePuzzles = PUZZLE_DATA.filter(p => p.id !== currentPuzzleIdToAvoid);
    const puzzlePool = availablePuzzles.length > 0 ? availablePuzzles : PUZZLE_DATA;
    const nextPuzzle = puzzlePool[Math.floor(Math.random() * puzzlePool.length)];
    
    const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
    let imageSrc = nextPuzzle.imageSrc; // Default to hardcoded image
    let imageAlt = nextPuzzle.imageAlt; // Default to hardcoded alt

    let category = undefined;
    if (nextPuzzle.hint.includes("animal")) {
      category = "animals";
    } else if (nextPuzzle.hint.includes("fruit") || nextPuzzle.hint.includes("food")) {
      category = "food";
    } else if (nextPuzzle.hint.includes("sky") || nextPuzzle.hint.includes("nature")) {
      category = "nature";
    }
    if (apiKey) {

      try {
        const images = await searchImages(nextPuzzle.hint, apiKey, { category });
        if (images && images.length > 0) {
          // Use the first image from Pixabay
          imageSrc = images[0].webformatURL;
          imageAlt = images[0].tags; // Pixabay provides tags
        } else {
           console.warn(`No images found on Pixabay for hint: ${nextPuzzle.hint}. Using fallback image.`);
        }
      } catch (error) {
        console.error("Error fetching image from Pixabay:", error);
        console.warn(`Using fallback image for hint: ${nextPuzzle.hint} due to API error.`);
      }
    } else {
       console.warn("Pixabay API key not set. Using fallback image.");
    }
    setCurrentPuzzle({...nextPuzzle, imageSrc, imageAlt});
    setShuffledOptions(shuffleArray(nextPuzzle.options));
    setIsAnswered(false);
    setFeedback(null); // Clear previous feedback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionsAnswered, score, MAX_QUESTIONS]); // currentPuzzle removed from deps to avoid potential loops if it contains complex objects that change identity. Logic relies on questionsAnswered.

  useEffect(() => {
    if (questionsAnswered === 0) {
      loadNextPuzzle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionsAnswered, MAX_QUESTIONS]); // loadNextPuzzle removed to break potential cycle as per error diagnosis.

  const handleAnswer = (selectedOption: string) => {
    if (!currentPuzzle || isAnswered) return;
    setIsAnswered(true);
    let isCorrect = false;
    let correctDetail = "";

    if (currentPuzzle.type === "matchWord") {
      if (selectedOption === currentPuzzle.correctWord) {
        isCorrect = true;
      }
      correctDetail = `The correct word was "${currentPuzzle.correctWord}".`;
    } else if (currentPuzzle.type === "missingLetter") {
      if (selectedOption === currentPuzzle.correctLetter) {
        isCorrect = true;
      }
      correctDetail = `The correct letter was "${currentPuzzle.correctLetter}". The word is "${currentPuzzle.fullWord}".`;
    }

    let newScore = score;
    if (isCorrect) {
      newScore = score + 1;
      setScore(newScore);
      setFeedback({ message: "Correct! Well done!", type: "correct" });
      toast({
        title: "Great Job!",
        description: `That's right!`,
        className: "bg-green-500 text-white",
      });
    } else {
      setFeedback({ message: `Not quite! ${correctDetail}`, type: "incorrect" });
      toast({
        variant: "destructive",
        title: "Try Again!",
        description: `That wasn't the right match. Keep learning!`,
      });
    }

    setTimeout(() => {
      const newQuestionsAnswered = questionsAnswered + 1;
      setQuestionsAnswered(newQuestionsAnswered);

      if (newQuestionsAnswered < MAX_QUESTIONS) {
        loadNextPuzzle();
      } else {
        setFeedback({ message: `Game Over! Your final score: ${newScore}/${MAX_QUESTIONS}`, type: "info" });
        setCurrentPuzzle(null);
      }
    }, isCorrect ? 1500 : 3000);
  };

  const resetGame = () => {
    setScore(0);
    setQuestionsAnswered(0); // This will trigger the useEffect to load a new puzzle
    setFeedback(null);
    setIsAnswered(false);
  };

  const getPuzzleTitle = () => {
    if (!currentPuzzle) return "Easy English Fun";
    return currentPuzzle.type === "matchWord" ? "Match the Word" : "Find the Missing Letter";
  };
  
  const getPuzzleInstruction = () => {
    if (!currentPuzzle) return "Loading...";
    return currentPuzzle.type === "matchWord" 
      ? "Which word matches the picture?" 
      : `What letter is missing from "${currentPuzzle.wordPattern.replace(/_/g, ' _ ')}"?`;
  };

  return (
    <>
      <HeadMetadata />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-center space-x-3">
              <BookMarked size={36} className="text-indigo-500" />
              <CardTitle className="text-3xl font-bold text-primary">{getPuzzleTitle()}</CardTitle>
            </div>
            <CardDescription className="text-center text-md text-foreground/80 pt-2 min-h-[3em]">
              Score: {score} / {questionsAnswered < MAX_QUESTIONS ? MAX_QUESTIONS : MAX_QUESTIONS} (Round: {questionsAnswered < MAX_QUESTIONS ? questionsAnswered + 1 : MAX_QUESTIONS})
              {currentPuzzle && questionsAnswered < MAX_QUESTIONS && (
                 <p className="text-sm text-muted-foreground mt-1">{getPuzzleInstruction()}</p>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-6">
            {currentPuzzle && questionsAnswered < MAX_QUESTIONS ? (
              <>
                <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden shadow-md border-2 border-primary/30 bg-slate-100">
                  <Image
                    src={currentPuzzle.imageSrc}
                    alt={currentPuzzle.imageAlt}
                    layout="fill"
                    objectFit="contain" 
                    data-ai-hint={currentPuzzle.hint}
                    priority
                  />
                </div>

                {currentPuzzle.type === "missingLetter" && (
                  <p className="text-3xl sm:text-4xl font-bold tracking-wider my-4">
                    {currentPuzzle.wordPattern.split('').map((char, idx) => (
                      <span key={idx} className={char === '_' ? 'text-destructive mx-1' : 'mx-0.5'}>
                        {char === '_' ? ' __ ' : char}
                      </span>
                    ))}
                  </p>
                )}

                <div className={cn(
                  "grid gap-3",
                  currentPuzzle.options.length <=3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4" // Adjust grid for more options if needed
                )}>
                  {shuffledOptions.map((option) => (
                    <Button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      disabled={isAnswered}
                      variant="outline"
                      className={cn(
                        "text-lg py-3 h-auto transition-all duration-200 ease-in-out",
                        "hover:bg-accent/20 focus:ring-2 focus:ring-accent",
                        isAnswered && currentPuzzle.type === "matchWord" && option === currentPuzzle.correctWord && "bg-green-500/20 border-green-600 text-green-700 hover:bg-green-500/30",
                        isAnswered && currentPuzzle.type === "missingLetter" && option === currentPuzzle.correctLetter && "bg-green-500/20 border-green-600 text-green-700 hover:bg-green-500/30",
                        isAnswered && feedback?.type === "incorrect" && (
                          (currentPuzzle.type === "matchWord" && option !== currentPuzzle.correctWord) ||
                          (currentPuzzle.type === "missingLetter" && option !== currentPuzzle.correctLetter)
                        ) && "bg-red-500/20 border-red-600 text-red-700 hover:bg-red-500/30"
                      )}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
                {feedback && (feedback.type !== "info" || questionsAnswered >= MAX_QUESTIONS) && (
                  <div
                    className={cn(
                      "mt-4 p-3 rounded-md text-center font-medium",
                      feedback.type === "correct" && "bg-green-100 text-green-700",
                      feedback.type === "incorrect" && "bg-red-100 text-red-700",
                      feedback.type === "info" && "bg-blue-100 text-blue-700"
                    )}
                  >
                    {feedback.type === "correct" && <CheckCircle className="inline mr-2" />}
                    {feedback.type === "incorrect" && <XCircle className="inline mr-2" />}
                    {feedback.type === "info" && <HelpCircle className="inline mr-2" />}
                    {feedback.message}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <Sparkles size={64} className="mx-auto text-yellow-500" />
                <p className="text-2xl font-semibold text-accent">
                  {questionsAnswered >= MAX_QUESTIONS && feedback?.type === "info"
                    ? feedback.message
                    : "Loading Puzzles..."}
                </p>
                {questionsAnswered >= MAX_QUESTIONS && (
                  <Button onClick={resetGame} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <RotateCcw className="mr-2" /> Play Again
                  </Button>
                )}
              </div>
            )}
            <div className="mt-8 pt-6 border-t">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/puzzles">
                  <ArrowLeft size={16} className="mr-2" /> Back to All Puzzles
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


    