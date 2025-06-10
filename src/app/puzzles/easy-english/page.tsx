
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookMarked, ArrowLeft, Lightbulb, Sparkles, XCircle, CheckCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PuzzleItem {
  id: string;
  imageSrc: string;
  imageAlt: string;
  correctWord: string;
  options: string[]; // Should include the correctWord and some distractors
  hint: string; // For data-ai-hint
}

const PUZZLE_DATA: PuzzleItem[] = [
  {
    id: "1",
    imageSrc: "https://placehold.co/300x200.png",
    imageAlt: "An apple",
    correctWord: "Apple",
    options: ["Apple", "Banana", "Carrot"],
    hint: "fruit red",
  },
  {
    id: "2",
    imageSrc: "https://placehold.co/300x200.png",
    imageAlt: "A ball",
    correctWord: "Ball",
    options: ["Ball", "Box", "Book"],
    hint: "toy round",
  },
  {
    id: "3",
    imageSrc: "https://placehold.co/300x200.png",
    imageAlt: "A cat",
    correctWord: "Cat",
    options: ["Cat", "Dog", "Car"],
    hint: "animal pet",
  },
  {
    id: "4",
    imageSrc: "https://placehold.co/300x200.png",
    imageAlt: "A dog",
    correctWord: "Dog",
    options: ["Dog", "Duck", "Door"],
    hint: "animal bark",
  },
  {
    id: "5",
    imageSrc: "https://placehold.co/300x200.png",
    imageAlt: "A sun",
    correctWord: "Sun",
    options: ["Sun", "Star", "Moon"],
    hint: "sky bright",
  },
];

// Helper function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Client component to inject metadata
const HeadMetadata = () => {
  return (
    <>
      <title>Easy English: Word Match | Shravya Playhouse</title>
      <meta name="description" content="Learn basic English words by matching them to pictures in this fun puzzle!" />
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

  const MAX_QUESTIONS = 5; // Play 5 questions per game session

  const loadNextPuzzle = useCallback(() => {
    if (questionsAnswered >= MAX_QUESTIONS) {
      setFeedback({ message: `Game Over! Your final score: ${score}/${MAX_QUESTIONS}`, type: "info" });
      setCurrentPuzzle(null); // End game
      return;
    }

    // To avoid immediate repeat, we read currentPuzzle directly from state.
    // This means loadNextPuzzle's useCallback dependencies should reflect this.
    const currentPuzzleIdToAvoid = currentPuzzle ? currentPuzzle.id : null;
    
    const availablePuzzles = PUZZLE_DATA.filter(p => p.id !== currentPuzzleIdToAvoid);
    const puzzlePool = availablePuzzles.length > 0 ? availablePuzzles : PUZZLE_DATA;
    
    const nextPuzzle = puzzlePool[Math.floor(Math.random() * puzzlePool.length)];

    setCurrentPuzzle(nextPuzzle);
    setShuffledOptions(shuffleArray(nextPuzzle.options));
    setFeedback(null);
    setIsAnswered(false);
  }, [questionsAnswered, score, currentPuzzle, MAX_QUESTIONS]); // MAX_QUESTIONS is stable, PUZZLE_DATA is stable.

  useEffect(() => {
    // This effect handles the initial loading of a puzzle and reset.
    if (questionsAnswered === 0) {
      loadNextPuzzle();
    }
    // By not including loadNextPuzzle in the dependency array here, we break the loop
    // if loadNextPuzzle's own execution (and subsequent state updates) would cause its
    // reference to change and re-trigger this effect when questionsAnswered is still 0.
    // This relies on loadNextPuzzle being correctly defined by its useCallback dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionsAnswered, MAX_QUESTIONS]);

  const handleAnswer = (selectedWord: string) => {
    if (!currentPuzzle || isAnswered) return;
    setIsAnswered(true);
    let isCorrect = false;

    if (selectedWord === currentPuzzle.correctWord) {
      setScore((prevScore) => prevScore + 1);
      setFeedback({ message: "Correct! Well done!", type: "correct" });
      toast({
        title: "Great Job!",
        description: `You matched "${selectedWord}" correctly!`,
        className: "bg-green-500 text-white",
      });
      isCorrect = true;
    } else {
      setFeedback({ message: `Not quite! The correct answer was "${currentPuzzle.correctWord}".`, type: "incorrect" });
      toast({
        variant: "destructive",
        title: "Try Again!",
        description: `"${selectedWord}" was not the right match. Keep trying!`,
      });
    }

    setTimeout(() => {
      const newQuestionsAnswered = questionsAnswered + 1;
      setQuestionsAnswered(newQuestionsAnswered); // Update state first

      if (newQuestionsAnswered < MAX_QUESTIONS) {
          loadNextPuzzle(); // Load next based on the updated questionsAnswered
      } else {
           const finalScore = isCorrect ? score + 1 : score;
           setFeedback({ message: `Game Over! Your final score: ${finalScore}/${MAX_QUESTIONS}`, type: "info" });
           setCurrentPuzzle(null);
      }
    }, isCorrect ? 1500 : 2500);
  };

  const resetGame = () => {
    setScore(0);
    setQuestionsAnswered(0); // This will trigger the useEffect to load the first puzzle
  };

  return (
    <>
      <HeadMetadata />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-center space-x-3">
              <BookMarked size={36} className="text-indigo-500" />
              <CardTitle className="text-3xl font-bold text-primary">Easy English: Word Match</CardTitle>
            </div>
            <CardDescription className="text-center text-md text-foreground/80 pt-2">
              Match the picture to the correct English word! Score: {score} / {questionsAnswered < MAX_QUESTIONS ? questionsAnswered : MAX_QUESTIONS} (Max: {MAX_QUESTIONS})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-6">
            {currentPuzzle && questionsAnswered < MAX_QUESTIONS ? (
              <>
                <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden shadow-md border-2 border-primary/30">
                  <Image
                    src={currentPuzzle.imageSrc}
                    alt={currentPuzzle.imageAlt}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={currentPuzzle.hint}
                    priority
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {shuffledOptions.map((option) => (
                    <Button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      disabled={isAnswered}
                      variant="outline"
                      className={cn(
                        "text-lg py-3 h-auto transition-all duration-200 ease-in-out",
                        "hover:bg-accent/20 focus:ring-2 focus:ring-accent",
                        isAnswered && option === currentPuzzle.correctWord && "bg-green-500/20 border-green-600 text-green-700 hover:bg-green-500/30",
                        isAnswered && option !== currentPuzzle.correctWord && feedback?.type === "incorrect" && "bg-red-500/20 border-red-600 text-red-700 hover:bg-red-500/30"
                      )}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
                {feedback && (feedback.type !== "info" || questionsAnswered >= MAX_QUESTIONS) && ( // Show feedback unless it's info and game isn't over
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
                    {feedback.type === "info" && <Lightbulb className="inline mr-2" />}
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
                    : "Loading Puzzle..."}
                </p>
                 {questionsAnswered >= MAX_QUESTIONS && (
                    <Button onClick={resetGame} className="bg-accent text-accent-foreground hover:bg-accent/90">
                        <RotateCcw className="mr-2"/> Play Again
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

