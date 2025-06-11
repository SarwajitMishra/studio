
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sigma, Hash, RotateCcw, Award, ArrowLeft, CheckCircle, XCircle, Apple, Star, Heart, Smile, Cloud, Sun, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const QUESTIONS_PER_ROUND = 5;
const MIN_OBJECTS = 3;
const MAX_OBJECTS = 12;

const OBJECT_ICONS: { name: string; Icon: LucideIcon; color: string }[] = [
  { name: "Apple", Icon: Apple, color: "text-red-500" },
  { name: "Star", Icon: Star, color: "text-yellow-400" },
  { name: "Heart", Icon: Heart, color: "text-pink-500" },
  { name: "Smiley Face", Icon: Smile, color: "text-blue-500" },
  { name: "Cloud", Icon: Cloud, color: "text-sky-500" },
  { name: "Sun", Icon: Sun, color: "text-orange-400" },
];

interface CountTheObjectsProblem {
  id: string;
  ObjectIcon: LucideIcon;
  iconName: string;
  iconColor: string;
  count: number;
}

interface CountTheObjectsGameProps {
  onBack: () => void;
}

export default function CountTheObjectsGame({ onBack }: CountTheObjectsGameProps) {
  const [currentProblem, setCurrentProblem] = useState<CountTheObjectsProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const { toast } = useToast();

  const [usedIconsInCurrentCycle, setUsedIconsInCurrentCycle] = useState<string[]>([]);

  const generateProblemInternal = useCallback((iconsToExclude: string[]): CountTheObjectsProblem => {
    let R_OBJECT_ICONS = OBJECT_ICONS.filter(icon => !iconsToExclude.includes(icon.name));

    if (R_OBJECT_ICONS.length === 0 && OBJECT_ICONS.length > 0) {
      R_OBJECT_ICONS = OBJECT_ICONS; // Allow picking any icon again if all have been used in this cycle
    }
    
    if (R_OBJECT_ICONS.length === 0) {
        const fallbackIcon = { name: "HelpCircle", Icon: HelpCircle, color: "text-gray-500" };
        console.warn("No icons available for problem generation (this should not happen if OBJECT_ICONS is populated). Using fallback.");
        return {
            id: `cto-fallback-${Date.now()}`,
            ObjectIcon: fallbackIcon.Icon,
            iconName: fallbackIcon.name,
            iconColor: fallbackIcon.color,
            count: 1,
        };
    }

    const randomIconIndex = Math.floor(Math.random() * R_OBJECT_ICONS.length);
    const selectedObject = R_OBJECT_ICONS[randomIconIndex];
    const count = Math.floor(Math.random() * (MAX_OBJECTS - MIN_OBJECTS + 1)) + MIN_OBJECTS;

    return {
      id: `cto-${Date.now()}-${Math.random()}`,
      ObjectIcon: selectedObject.Icon,
      iconName: selectedObject.name,
      iconColor: selectedObject.color,
      count,
    };
  }, []);


  const loadNewProblem = useCallback(() => {
    let iconsToFilter = usedIconsInCurrentCycle;
    let nextUsedIcons = [...usedIconsInCurrentCycle];

    if (usedIconsInCurrentCycle.length >= OBJECT_ICONS.length && OBJECT_ICONS.length > 0) {
      // All unique icons shown, reset cycle
      nextUsedIcons = [];
      iconsToFilter = []; 
    }

    const newProblem = generateProblemInternal(iconsToFilter);
    setCurrentProblem(newProblem);
    
    // Add current problem's icon to the new list of used icons for the cycle
    // If the cycle was just reset (nextUsedIcons is empty), this starts a new list.
    setUsedIconsInCurrentCycle([...nextUsedIcons, newProblem.iconName]);
    
    setUserAnswer("");
    setFeedback(null);
  }, [usedIconsInCurrentCycle, generateProblemInternal]);

  const resetGame = useCallback(() => {
    setScore(0);
    setQuestionsAnswered(0);
    setIsGameOver(false);
    setFeedback(null);
    setUserAnswer("");
    setUsedIconsInCurrentCycle([]); // Reset for the new game
    // loadNewProblem will be called by the useEffect below due to state changes
  }, []);

  // Effect for initial game load and subsequent problem loads after reset or question answered
  useEffect(() => {
    if (!isGameOver && (questionsAnswered === 0 || (questionsAnswered > 0 && questionsAnswered < QUESTIONS_PER_ROUND))) {
        // Only load if not game over and (it's the first question OR it's an intermediate question)
        // This condition prevents loading a new problem after the last question before game over message is fully processed.
        if (currentProblem === null || feedback !== null || questionsAnswered === 0) {
            // This complex condition ensures we only load a new problem when truly needed:
            // - Initial load (currentProblem is null)
            // - After feedback is processed (feedback is not null, indicating previous question completed)
            // - Explicit first question (questionsAnswered is 0) - covered by currentProblem === null for initial
            if(questionsAnswered === 0 && !currentProblem){ // Initial very first load
                 loadNewProblem();
            } else if (feedback !== null && !isGameOver) { // Subsequent loads after an answer
                 loadNewProblem();
            }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionsAnswered, isGameOver, feedback]); // Key dependencies that trigger problem loading logic


  // Effect for initial setup (calls resetGame once on mount)
  useEffect(() => {
    resetGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleSubmitAnswer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentProblem || isGameOver || feedback) return;

    const answerNum = parseInt(userAnswer, 10);
    if (isNaN(answerNum)) {
      setFeedback("Please enter a valid number.");
      toast({ variant: "destructive", title: "Invalid Input", description: "Your answer must be a number." });
      return;
    }

    const isCorrect = answerNum === currentProblem.count;
    let currentFeedbackMsg = "";

    if (isCorrect) {
      setScore(prev => prev + 1);
      currentFeedbackMsg = "Correct!";
      toast({ title: "Correct!", className: "bg-green-500 text-white" });
    } else {
      currentFeedbackMsg = `Not quite. There were ${currentProblem.count} ${currentProblem.iconName.toLowerCase()}s.`;
      toast({ variant: "destructive", title: "Incorrect!", description: `The correct count was ${currentProblem.count}.` });
    }
    
    setFeedback(currentFeedbackMsg); // Set feedback immediately

    setTimeout(() => {
      const newQuestionsAnswered = questionsAnswered + 1;
      if (newQuestionsAnswered >= QUESTIONS_PER_ROUND) {
        setIsGameOver(true);
        // Update feedback directly for game over, don't rely on another setFeedback in this path
        setFeedback(isCorrect ? `Correct! Final Score: ${score + 1}/${QUESTIONS_PER_ROUND}` : `Not quite. There were ${currentProblem.count} ${currentProblem.iconName.toLowerCase()}s. Final Score: ${score}/${QUESTIONS_PER_ROUND}`);
      } else {
        setQuestionsAnswered(newQuestionsAnswered); // This will trigger the useEffect to load a new problem
      }
    }, isCorrect ? 1500 : 3000);
  };

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader className="bg-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sigma size={28} className="text-primary" />
            <CardTitle className="text-2xl font-bold text-primary">Count the Objects</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
        </div>
        <CardDescription className="text-center text-md text-foreground/80 pt-2">
          How many objects do you see? Score: {score}/{QUESTIONS_PER_ROUND} (Question: {Math.min(questionsAnswered + 1, QUESTIONS_PER_ROUND)})
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {isGameOver ? (
          <div className="text-center p-6 bg-pink-100 rounded-lg shadow-inner">
            <Award className="mx-auto h-16 w-16 text-yellow-500 mb-3" />
            <h2 className="text-2xl font-bold text-pink-700">Round Over!</h2>
            <p className="text-lg text-pink-600 mt-1">{feedback || `Your final score is ${score}/${QUESTIONS_PER_ROUND}.`}</p>
            <Button onClick={resetGame} className="mt-6 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <RotateCcw className="mr-2 h-5 w-5" /> Play Again
            </Button>
          </div>
        ) : currentProblem && (
          <>
            <div className="text-center p-4 bg-muted rounded-lg min-h-[150px] flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {Array.from({ length: currentProblem.count }).map((_, index) => (
                <currentProblem.ObjectIcon
                  key={index}
                  size={32}
                  className={cn("transition-transform duration-200 hover:scale-110", currentProblem.iconColor)}
                  aria-hidden="true"
                />
              ))}
            </div>
             <p className="text-center text-lg font-medium mt-2">
                How many <span className={cn("font-bold", currentProblem.iconColor)}>{currentProblem.iconName.toLowerCase()}s</span> do you see?
            </p>
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div>
                <Label htmlFor="countAnswer" className="text-base font-medium flex items-center mb-1">
                  <Hash className="mr-2 h-5 w-5 text-muted-foreground" /> Your Count:
                </Label>
                <Input
                  id="countAnswer"
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter your count"
                  className="text-base"
                  disabled={isGameOver || !!feedback}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isGameOver || !!feedback || !userAnswer.trim()}>
                Submit Answer
              </Button>
            </form>
            {feedback && !isGameOver && (
              <div className={cn(
                "mt-4 p-3 rounded-md text-center font-medium flex items-center justify-center",
                feedback.startsWith("Correct") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                 {feedback.startsWith("Correct") ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
                {feedback}
              </div>
            )}
          </>
        )}
         {!currentProblem && !isGameOver && (
            <div className="text-center p-6">
                <HelpCircle size={48} className="mx-auto text-primary/50 mb-4"/>
                <p className="text-lg text-muted-foreground">Loading puzzle...</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

