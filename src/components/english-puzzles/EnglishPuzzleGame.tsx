
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, XCircle, CheckCircle, RotateCcw, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { searchImages } from "@/services/pixabay";
import { ENGLISH_PUZZLE_DATA, type EnglishPuzzleItem, type EnglishPuzzleSubtype, type Difficulty } from "@/lib/constants";

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

interface EnglishPuzzleGameProps {
  puzzleType: EnglishPuzzleSubtype;
  difficulty: Difficulty;
  onBack: () => void;
  puzzleName: string;
  Icon: LucideIcon;
}

export default function EnglishPuzzleGame({ puzzleType, difficulty, onBack, puzzleName, Icon }: EnglishPuzzleGameProps) {
  const [currentPuzzle, setCurrentPuzzle] = useState<EnglishPuzzleItem | null>(null);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [feedback, setFeedback] = useState<{ message: string; type: "correct" | "incorrect" | "info" } | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [usedPuzzleIds, setUsedPuzzleIds] = useState<string[]>([]);
  const { toast } = useToast();

  const MAX_QUESTIONS = 5;

  const loadNextPuzzle = useCallback(() => {
    setUsedPuzzleIds(prevUsedIds => {
      let availablePuzzles = ENGLISH_PUZZLE_DATA.filter(p => 
          p.type === puzzleType && 
          p.difficulty === difficulty &&
          !prevUsedIds.includes(p.id)
      );
      
      if (availablePuzzles.length === 0) {
        setUsedPuzzleIds([]); // Reset used IDs for this type/difficulty
        availablePuzzles = ENGLISH_PUZZLE_DATA.filter(p => p.type === puzzleType && p.difficulty === difficulty);
      }
      
      if (availablePuzzles.length === 0) {
          setFeedback({ message: `No puzzles available for ${difficulty} ${puzzleType}. Please select another.`, type: "info" });
          setCurrentPuzzle(null);
          return prevUsedIds;
      }
  
      const nextPuzzle = availablePuzzles[Math.floor(Math.random() * availablePuzzles.length)];
      
      const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
      let imageSrc = nextPuzzle.imageSrc;
      let imageAlt = nextPuzzle.imageAlt;
      const searchQuery = nextPuzzle.type === 'matchWord' ? nextPuzzle.correctWord : nextPuzzle.fullWord;
  
      if (apiKey) {
        searchImages(searchQuery, apiKey, { perPage: 5 }).then(images => {
          if (images && images.length > 0) {
            imageSrc = images[0].largeImageURL;
            imageAlt = images[0].tags;
          } else {
             console.warn(`No images found on Pixabay for query: ${searchQuery}. Using fallback image.`);
          }
          setCurrentPuzzle({...nextPuzzle, imageSrc, imageAlt});
        }).catch(error => {
          console.error("Error fetching image from Pixabay:", error);
          setCurrentPuzzle({...nextPuzzle, imageSrc, imageAlt});
        });
      } else {
        setCurrentPuzzle(nextPuzzle);
      }

      setShuffledOptions(shuffleArray(nextPuzzle.options));
      setIsAnswered(false);
      setSelectedAnswer(null);
      setFeedback(null);
      
      return [...prevUsedIds, nextPuzzle.id];
    });
  }, [puzzleType, difficulty]);

  const resetGame = useCallback(() => {
    setScore(0);
    setQuestionsAnswered(0);
    setFeedback(null);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setUsedPuzzleIds([]);
    loadNextPuzzle();
  }, [loadNextPuzzle]);

  useEffect(() => {
    resetGame();
  }, [resetGame, difficulty, puzzleType]);

  const handleAnswer = (selectedOption: string) => {
    if (!currentPuzzle || isAnswered) return;
    setIsAnswered(true);
    setSelectedAnswer(selectedOption);

    let isCorrect = false;
    let correctValue = "";

    if (currentPuzzle.type === "matchWord") {
      correctValue = currentPuzzle.correctWord;
      isCorrect = selectedOption === correctValue;
    } else if (currentPuzzle.type === "missingLetter") {
      correctValue = currentPuzzle.correctLetter;
      isCorrect = selectedOption === correctValue;
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
      const incorrectFeedback = currentPuzzle.type === 'matchWord'
        ? `The correct word was "${currentPuzzle.correctWord}".`
        : `The correct letter was "${currentPuzzle.correctLetter}". The word is "${currentPuzzle.fullWord}".`;
      setFeedback({ message: `Not quite! ${incorrectFeedback}`, type: "incorrect" });
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

  const getPuzzleInstruction = () => {
    if (!currentPuzzle) return "Loading...";
    return currentPuzzle.type === "matchWord" 
      ? "Which word matches the picture?" 
      : `What letter is missing from "${currentPuzzle.wordPattern.replace(/_/g, ' _ ')}"?`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon size={28} className="text-primary" />
              <CardTitle className="text-2xl font-bold text-primary">{puzzleName}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
          </div>
          <CardDescription className="text-center text-md text-foreground/80 pt-2 min-h-[3em]">
            Score: {score} / {MAX_QUESTIONS} | Round: {Math.min(questionsAnswered + 1, MAX_QUESTIONS)} | Difficulty: <span className="capitalize">{difficulty}</span>
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
                  data-ai-hint={currentPuzzle.type === 'matchWord' ? currentPuzzle.correctWord : currentPuzzle.fullWord}
                  priority
                  unoptimized={currentPuzzle.imageSrc.includes('pixabay.com')}
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
                currentPuzzle.options.length <=3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"
              )}>
                {shuffledOptions.map((option) => {
                  const isCorrectOption = currentPuzzle.type === "matchWord" ? option === currentPuzzle.correctWord : option === currentPuzzle.correctLetter;
                  const isSelectedIncorrect = isAnswered && selectedAnswer === option && !isCorrectOption;

                  return (
                    <Button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      disabled={isAnswered}
                      variant="outline"
                      className={cn(
                        "text-lg py-3 h-auto transition-all duration-200 ease-in-out",
                        "hover:bg-accent/20 focus:ring-2 focus:ring-accent",
                        isAnswered && isCorrectOption && "bg-green-100 border-green-600 text-green-700 hover:bg-green-100/80 ring-2 ring-green-500",
                        isSelectedIncorrect && "bg-red-100 border-red-600 text-red-700 hover:bg-red-100/80 ring-2 ring-red-500",
                        isAnswered && !isCorrectOption && option !== selectedAnswer && "opacity-60"
                      )}
                    >
                      {option}
                    </Button>
                  )
                })}
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
                {feedback?.message || "Loading Puzzles..."}
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
  );
}
