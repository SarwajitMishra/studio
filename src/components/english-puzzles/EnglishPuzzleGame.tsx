
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, XCircle, CheckCircle, RotateCcw, HelpCircle, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { searchImages } from "@/services/pixabay";
import type { EnglishPuzzleItem, EnglishPuzzleSubtype, Difficulty } from "@/lib/constants";
import { generateEnglishPuzzle, type GenerateEnglishPuzzleInput } from "@/ai/flows/generate-english-puzzle-flow";

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

const MAX_QUESTIONS = 5;

export default function EnglishPuzzleGame({ puzzleType, difficulty, onBack, puzzleName, Icon }: EnglishPuzzleGameProps) {
  const [currentPuzzle, setCurrentPuzzle] = useState<EnglishPuzzleItem | null>(null);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [feedback, setFeedback] = useState<{ message: string; type: "correct" | "incorrect" | "info" } | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);

  const { toast } = useToast();
  const sessionKey = `usedEnglishWords_${puzzleType}_${difficulty}`;

  const getUsedWordsFromSession = (): string[] => {
    if (typeof window === 'undefined') return [];
    const stored = sessionStorage.getItem(sessionKey);
    return stored ? JSON.parse(stored) : [];
  };

  const addUsedWordToSession = (word: string) => {
    if (typeof window === 'undefined') return;
    const currentWords = getUsedWordsFromSession();
    const newWords = [...currentWords, word];
    sessionStorage.setItem(sessionKey, JSON.stringify(newWords));
  };
  
  const resetSessionHistory = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(sessionKey);
    }
  };

  const loadNextPuzzle = useCallback(async () => {
    setIsGenerating(true);
    setFeedback(null);
    setCurrentPuzzle(null);

    try {
      const usedWords = getUsedWordsFromSession();
      const input: GenerateEnglishPuzzleInput = {
        puzzleType,
        difficulty,
        wordsToExclude: usedWords,
      };

      const newPuzzle = await generateEnglishPuzzle(input);
      
      const newWord = newPuzzle.type === 'matchWord' ? newPuzzle.correctWord : newPuzzle.fullWord;
      addUsedWordToSession(newWord);

      setCurrentPuzzle(newPuzzle);
      setShuffledOptions(shuffleArray(newPuzzle.options));
      setIsAnswered(false);
      setSelectedAnswer(null);

      const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
      if (apiKey && newPuzzle.imageQuery) {
        searchImages(newPuzzle.imageQuery, apiKey, { perPage: 1 }).then(images => {
          if (images && images.length > 0) {
            setCurrentPuzzle(p => p && p.id === newPuzzle.id ? {...p, imageSrc: images[0].largeImageURL, imageAlt: images[0].tags} : p);
          }
        }).catch(error => {
          console.error("Error fetching image from Pixabay:", error);
        });
      }
    } catch (error) {
      console.error("Failed to generate puzzle:", error);
      toast({
        variant: "destructive",
        title: "Puzzle Generation Failed",
        description: "Could not create a new puzzle. Please try again later.",
      });
      setIsRoundOver(true);
      setFeedback({ message: "Oops! We couldn't create a new puzzle right now.", type: "info" });
    } finally {
      setIsGenerating(false);
    }
  }, [puzzleType, difficulty, sessionKey, toast]);

  const startNewRound = useCallback(() => {
    resetSessionHistory(); // Clear history for a completely new round
    setScore(0);
    setQuestionsAnswered(0);
    setIsRoundOver(false);
    setFeedback(null);
    loadNextPuzzle();
  }, [loadNextPuzzle]);

  useEffect(() => {
    startNewRound();
  }, [difficulty, puzzleType]);


  const handleAnswer = (selectedOption: string) => {
    if (!currentPuzzle || isAnswered) return;
    setIsAnswered(true);
    setSelectedAnswer(selectedOption);

    let isCorrect = false;

    if (currentPuzzle.type === "matchWord") {
      isCorrect = selectedOption === currentPuzzle.correctWord;
    } else if (currentPuzzle.type === "missingLetter") {
      isCorrect = selectedOption === currentPuzzle.correctLetter;
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

      if (newQuestionsAnswered >= MAX_QUESTIONS) {
        setIsRoundOver(true);
        setFeedback({ message: `Round Over! Your final score: ${newScore}/${MAX_QUESTIONS}`, type: "info" });
        setCurrentPuzzle(null);
      } else {
        loadNextPuzzle();
      }
    }, isCorrect ? 1500 : 3000);
  };
  
  const getPuzzleInstruction = () => {
    if (isGenerating) return "Generating a new puzzle...";
    if (!currentPuzzle) return "Loading...";
    return currentPuzzle.type === "matchWord" 
      ? "Which word matches the picture?" 
      : `What letter is missing from "${currentPuzzle.wordPattern.replace(/_/g, ' _ ')}"?`;
  };

  const renderGameOverView = () => (
    <div className="space-y-4 text-center">
      <Sparkles size={64} className="mx-auto text-yellow-500" />
      <p className="text-2xl font-semibold text-accent">
        {feedback?.message || "Round complete!"}
      </p>
      <Button onClick={startNewRound} className="bg-accent text-accent-foreground hover:bg-accent/90">
        <RotateCcw className="mr-2" /> 
        Play Again
      </Button>
    </div>
  );
  
  const renderLoadingView = () => (
    <div className="text-center p-6 space-y-4">
      <Loader2 size={48} className="mx-auto text-primary animate-spin" />
      <p className="text-lg text-muted-foreground">Generating a fun new puzzle for you...</p>
    </div>
  );

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
            Score: {score} / {MAX_QUESTIONS} | Question: {Math.min(questionsAnswered + 1, MAX_QUESTIONS)} | Difficulty: <span className="capitalize">{difficulty}</span>
            <p className="text-sm text-muted-foreground mt-1">{getPuzzleInstruction()}</p>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-6 min-h-[400px] flex flex-col justify-center">
          {isGenerating && !isRoundOver ? (
            renderLoadingView()
          ) : currentPuzzle && !isRoundOver ? (
            <>
              <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden shadow-md border-2 border-primary/30 bg-slate-100">
                <Image
                  src={currentPuzzle.imageSrc}
                  alt={currentPuzzle.imageAlt}
                  layout="fill"
                  objectFit="contain" 
                  data-ai-hint={currentPuzzle.imageQuery}
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
              {feedback && !isRoundOver && (
                <div
                  className={cn(
                    "mt-4 p-3 rounded-md text-center font-medium",
                    feedback.type === "correct" && "bg-green-100 text-green-700",
                    feedback.type === "incorrect" && "bg-red-100 text-red-700"
                  )}
                >
                  {feedback.type === "correct" && <CheckCircle className="inline mr-2" />}
                  {feedback.type === "incorrect" && <XCircle className="inline mr-2" />}
                  {feedback.message}
                </div>
              )}
            </>
          ) : (
             renderGameOverView()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
