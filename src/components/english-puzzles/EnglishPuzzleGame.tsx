
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, XCircle, CheckCircle, RotateCcw, Lightbulb, Loader2, Eraser, Star, Shrink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { EnglishPuzzleItem, EnglishPuzzleSubtype, Difficulty } from "@/lib/constants";
import { generateEnglishPuzzle, type GenerateEnglishPuzzleInput } from "@/ai/flows/generate-english-puzzle-flow";
import { updateGameStats } from "@/lib/progress";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from "@/lib/constants";
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { useFullscreen } from "@/hooks/use-fullscreen";

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
  theme?: string;
}

const MAX_QUESTIONS = 5;

export default function EnglishPuzzleGame({ puzzleType, difficulty, onBack, puzzleName, Icon, theme }: EnglishPuzzleGameProps) {
  const [currentPuzzle, setCurrentPuzzle] = useState<EnglishPuzzleItem | null>(null);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [feedback, setFeedback] = useState<{ message: string; type: "correct" | "incorrect" | "info" } | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);

  // State for Sentence Scramble
  const [builtSentence, setBuiltSentence] = useState<string[]>([]);
  const [scrambledWordsBank, setScrambledWordsBank] = useState<string[]>([]);

  const { toast } = useToast();
  const sessionKey = `usedEnglishWords_${puzzleType}_${difficulty}_${theme || 'general'}`;

  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameContainerRef);

  useEffect(() => {
    enterFullscreen();
  }, []);

  const handleExit = () => {
    exitFullscreen();
    onBack();
  }

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
    if (typeof window === 'undefined') {
      sessionStorage.removeItem(sessionKey);
    }
  };

  const loadNextPuzzle = useCallback(async () => {
    setIsGenerating(true);
    setFeedback(null);
    setCurrentPuzzle(null);
    setBuiltSentence([]);

    try {
      const usedWords = getUsedWordsFromSession();
      const input: GenerateEnglishPuzzleInput = {
        puzzleType,
        difficulty,
        theme: theme as any, // Cast because the enum is string[]
        wordsToExclude: usedWords,
      };

      const puzzleData = await generateEnglishPuzzle(input);

      if (puzzleData.type === 'matchWord') {
        addUsedWordToSession(puzzleData.correctWord);
        setCurrentPuzzle(puzzleData);
        setShuffledOptions(shuffleArray(puzzleData.options));
      } else if (puzzleData.type === 'missingLetter') {
        addUsedWordToSession(puzzleData.fullWord);
        setCurrentPuzzle(puzzleData);
        setShuffledOptions(shuffleArray(puzzleData.options));
      } else if (puzzleData.type === 'sentenceScramble') {
        addUsedWordToSession(puzzleData.correctSentence);
        setCurrentPuzzle(puzzleData);
        setScrambledWordsBank(shuffleArray(puzzleData.scrambledWords));
      } else if (puzzleData.type === 'oddOneOut') {
        addUsedWordToSession(puzzleData.correctAnswer);
        setCurrentPuzzle(puzzleData);
        setShuffledOptions(shuffleArray(puzzleData.options));
      }

      setIsAnswered(false);
      setSelectedAnswer(null);

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
  }, [puzzleType, difficulty, theme, sessionKey, toast]);

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex justify-center">
        {[...Array(3)].map((_, i) => (
            <Star key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
        ))}
    </div>
  );

  const calculateStars = (score: number, maxScore: number): number => {
      const percentage = (score / maxScore) * 100;
      if (percentage === 100) return 3; // Perfect score
      if (percentage >= 75) return 2; // Good score
      if (percentage > 0) return 1; // At least one correct
      return 0; // No correct answers
  };

  const handleGameOver = useCallback(async (finalScore: number) => {
    setIsRoundOver(true);
    setIsCalculatingReward(true);
    const didWin = finalScore === MAX_QUESTIONS;
    updateGameStats({ gameId: puzzleType, didWin, score: finalScore * 100 });
    
    // Clear the current puzzle to show the game over screen immediately
    setCurrentPuzzle(null);

    try {
        const rewards = await calculateRewards({
            gameId: puzzleType,
            difficulty,
            performanceMetrics: { score: finalScore, maxScore: MAX_QUESTIONS }
        });
        const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Completed ${puzzleName} (${difficulty})`);
        const stars = calculateStars(finalScore, MAX_QUESTIONS);
        setLastReward({ points: earned.points, coins: earned.coins, stars });

        toast({
            title: "Round Complete!",
            description: `You scored ${finalScore}/${MAX_QUESTIONS}.`,
            className: "bg-primary/20",
        });

    } catch(error) {
        console.error(`Error calculating rewards for ${puzzleType}:`, error);
        toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
        // Set a simple feedback message in case of error
        setFeedback({ message: `Round Over! Your final score: ${finalScore}/${MAX_QUESTIONS}`, type: "info" });
    } finally {
        setIsCalculatingReward(false);
    }
  }, [puzzleType, difficulty, puzzleName, toast]);

  const processAnswerResult = useCallback((isCorrect: boolean) => {
    setIsAnswered(true);
    
    // Use a functional update to get the latest score
    let finalScore = score;
    if (isCorrect) {
      setScore(prev => {
        finalScore = prev + 1;
        return finalScore;
      });
      setFeedback({ message: "Correct! Well done!", type: "correct" });
      toast({
        title: "Great Job!",
        description: `That's right!`,
        className: "bg-green-500 text-white",
      });
    } else {
      let incorrectFeedback = "That wasn't the right answer. Keep learning!";
      if(currentPuzzle?.type === 'matchWord') {
        incorrectFeedback = `The correct word was "${currentPuzzle.correctWord}".`
      } else if (currentPuzzle?.type === 'missingLetter') {
        incorrectFeedback = `The correct letter was "${currentPuzzle.correctLetter}". The word is "${currentPuzzle.fullWord}".`;
      } else if (currentPuzzle?.type === 'oddOneOut') {
        incorrectFeedback = `Correct answer was "${currentPuzzle.correctAnswer}". ${currentPuzzle.category}`;
      } else if (currentPuzzle?.type === 'sentenceScramble') {
        incorrectFeedback = `The correct sentence is: "${currentPuzzle.correctSentence}"`;
      }
      setFeedback({ message: `Not quite! ${incorrectFeedback}`, type: "incorrect" });
      toast({
        variant: "destructive",
        title: "Try Again!",
        description: incorrectFeedback,
      });
    }

    setTimeout(() => {
      const newQuestionsAnswered = questionsAnswered + 1;
      setQuestionsAnswered(newQuestionsAnswered);
      
      if (newQuestionsAnswered >= MAX_QUESTIONS) {
        handleGameOver(finalScore);
      } else {
        loadNextPuzzle();
      }
    }, isCorrect ? 1500 : 3000);
  }, [currentPuzzle, loadNextPuzzle, toast, questionsAnswered, score, handleGameOver]);

  const startNewRound = useCallback(() => {
    resetSessionHistory();
    setScore(0);
    setQuestionsAnswered(0);
    setIsRoundOver(false);
    setFeedback(null);
    setLastReward(null);
    loadNextPuzzle();
  }, [loadNextPuzzle]);

  useEffect(() => {
    startNewRound();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, theme]); // This effect should only re-run when difficulty or theme changes.


  const handleOptionSelect = (selectedOption: string) => {
    if (!currentPuzzle || isAnswered || currentPuzzle.type === 'sentenceScramble') return;
    setSelectedAnswer(selectedOption);

    let isCorrect = false;
    if (currentPuzzle.type === "matchWord") {
      isCorrect = selectedOption === currentPuzzle.correctWord;
    } else if (currentPuzzle.type === "missingLetter") {
      isCorrect = selectedOption === currentPuzzle.correctLetter;
    } else if (currentPuzzle.type === "oddOneOut") {
      isCorrect = selectedOption === currentPuzzle.correctAnswer;
    }
    processAnswerResult(isCorrect);
  };
  
  const handleSentenceWordClick = (word: string, index: number) => {
    setBuiltSentence(prev => [...prev, word]);
    setScrambledWordsBank(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleBuiltWordClick = (word: string, index: number) => {
    setBuiltSentence(prev => prev.filter((_, i) => i !== index));
    setScrambledWordsBank(prev => [...prev, word]);
  };
  
  const handleCheckSentence = () => {
    if (!currentPuzzle || currentPuzzle.type !== 'sentenceScramble') return;
    const userAnswer = builtSentence.join(' ');
    const correctAnswer = currentPuzzle.correctSentence.replace(/[.?!,]/g, '');
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    processAnswerResult(isCorrect);
  }

  const getPuzzleInstruction = () => {
    if (isGenerating) return "Generating a new puzzle...";
    if (!currentPuzzle) return "Loading...";
    switch(currentPuzzle.type) {
      case "matchWord": return "Which word matches the picture?";
      case "missingLetter": return `What letter is missing from "${currentPuzzle.wordPattern.replace(/_/g, ' _ ')}"?`;
      case "sentenceScramble": return "Click the words in the correct order to make a sentence.";
      case "oddOneOut": return "Which word does not belong with the others?";
      default: return "Solve the puzzle!";
    }
  };

  const renderGameOverView = () => (
    <div className="space-y-4 text-center">
        {isCalculatingReward ? (
            <div className="flex flex-col items-center justify-center gap-2 pt-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Calculating your rewards...</p>
            </div>
        ) : lastReward ? (
            <div className="flex flex-col items-center gap-3 text-center">
                <StarRating rating={lastReward.stars} />
                <p className="text-2xl font-semibold text-accent mt-2">
                    Final Score: {score}/{MAX_QUESTIONS}
                </p>
                <div className="flex items-center gap-6 mt-2">
                    <span className="flex items-center font-bold text-2xl">
                        +{lastReward.points} <SPointsIcon className="ml-2 h-7 w-7 text-yellow-400" />
                    </span>
                    <span className="flex items-center font-bold text-2xl">
                        +{lastReward.coins} <SCoinsIcon className="ml-2 h-7 w-7 text-amber-500" />
                    </span>
                </div>
            </div>
        ) : (
             <div className="space-y-4 text-center">
                <Sparkles size={64} className="mx-auto text-yellow-500" />
                <p className="text-2xl font-semibold text-accent">
                    {feedback?.message || "Round complete!"}
                </p>
             </div>
        )}
        <Button onClick={startNewRound} className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isCalculatingReward}>
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

  const renderOptionsBasedPuzzle = () => {
    if (!currentPuzzle || (currentPuzzle.type !== 'matchWord' && currentPuzzle.type !== 'missingLetter' && currentPuzzle.type !== 'oddOneOut')) return null;

    return (
      <>
        {currentPuzzle.type === 'matchWord' && (
          <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden shadow-md border-2 border-primary/30 bg-slate-100">
            <Image
              src={currentPuzzle.imageSrc}
              alt={currentPuzzle.imageAlt}
              fill
              style={{ objectFit: 'contain' }}
              data-ai-hint={currentPuzzle.correctWord}
              priority
            />
          </div>
        )}

        {currentPuzzle.type === "missingLetter" && (
          <>
            <p className="text-3xl sm:text-4xl font-bold tracking-wider my-4">
              {currentPuzzle.wordPattern.split('').map((char, idx) => (
                <span key={idx} className={char === '_' ? 'text-destructive mx-1' : 'mx-0.5'}>
                  {char === '_' ? ' __ ' : char}
                </span>
              ))}
            </p>
            <div className="mt-2 mb-4 p-3 bg-yellow-100/70 border border-yellow-400/50 rounded-lg text-yellow-800 text-sm flex items-center justify-center">
                <Lightbulb size={18} className="mr-2 flex-shrink-0" />
                <span><strong>Hint:</strong> {currentPuzzle.hint}</span>
            </div>
          </>
        )}

        {currentPuzzle.type === 'oddOneOut' && (
            <div className="mt-2 mb-4 p-3 bg-yellow-100/70 border border-yellow-400/50 rounded-lg text-yellow-800 text-sm flex items-center justify-center">
              <Lightbulb size={18} className="mr-2 flex-shrink-0" />
              <span><strong>Hint:</strong> {currentPuzzle.category}</span>
            </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {shuffledOptions.map((option) => {
            const isCorrectOption = (currentPuzzle.type === "matchWord" && option === currentPuzzle.correctWord) ||
                                    (currentPuzzle.type === "missingLetter" && option === currentPuzzle.correctLetter) ||
                                    (currentPuzzle.type === "oddOneOut" && option === currentPuzzle.correctAnswer);
            const isSelectedIncorrect = isAnswered && selectedAnswer === option && !isCorrectOption;

            return (
              <Button
                key={option}
                onClick={() => handleOptionSelect(option)}
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
      </>
    );
  };
  
  const renderSentenceScramblePuzzle = () => {
    if (!currentPuzzle || currentPuzzle.type !== 'sentenceScramble') return null;
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="font-semibold mb-2 text-foreground/80">Your Sentence:</h3>
          <div className="min-h-[6rem] p-3 border-2 border-dashed rounded-lg bg-muted/50 flex flex-wrap gap-2 items-center justify-center">
            {builtSentence.length === 0 && !isAnswered && <p className="text-muted-foreground">Click words from the word bank below.</p>}
            {builtSentence.map((word, index) => (
              <Button key={`${word}-${index}`} variant="secondary" className="shadow-sm" onClick={() => !isAnswered && handleBuiltWordClick(word, index)}>
                {word}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2 text-foreground/80">Word Bank:</h3>
          <div className="min-h-[6rem] p-3 flex flex-wrap gap-2 items-center justify-center">
            {scrambledWordsBank.map((word, index) => (
              <Button key={`${word}-${index}`} variant="outline" className="text-base" onClick={() => handleSentenceWordClick(word, index)} disabled={isAnswered}>
                {word}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-4">
            <Button onClick={() => { setBuiltSentence([]); setScrambledWordsBank(currentPuzzle.scrambledWords); }} disabled={isAnswered || builtSentence.length === 0} variant="ghost">
                <Eraser className="mr-2"/> Clear
            </Button>
            <Button onClick={handleCheckSentence} disabled={isAnswered || builtSentence.length === 0} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Check Answer
            </Button>
        </div>
      </div>
    )
  };

  return (
    <div ref={gameContainerRef} className={cn("w-full h-full flex items-center justify-center", isFullscreen && "bg-background")}>
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon size={28} className="text-primary" />
              <CardTitle className="text-2xl font-bold text-primary">{puzzleName}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleExit}>
                <Shrink size={16} className="mr-1" /> Exit
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
          ) : isRoundOver ? (
            renderGameOverView()
          ) : currentPuzzle ? (
            <>
              { (currentPuzzle.type === 'matchWord' || currentPuzzle.type === 'missingLetter' || currentPuzzle.type === 'oddOneOut') && renderOptionsBasedPuzzle() }
              { currentPuzzle.type === 'sentenceScramble' && renderSentenceScramblePuzzle() }

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
             renderLoadingView() // Fallback loading view
          )}
        </CardContent>
      </Card>
    </div>
  );
}
