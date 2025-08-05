
"use client";

import { useState, useEffect, useCallback, FormEvent, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wand, Hash, RotateCcw, Award, ArrowLeft, CheckCircle, XCircle, Loader2, Star, Shrink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Difficulty } from "@/lib/constants";
import { updateGameStats } from "@/lib/progress";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from "@/lib/constants";
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { useFullscreen } from "@/hooks/use-fullscreen";

const QUESTIONS_PER_ROUND = 5;

interface SequenceProblem {
  id: string;
  displaySequence: (number | string)[]; 
  answer: number; 
  description: string;
}

interface WhatComesNextGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

const generateProblem = (difficulty: Difficulty): SequenceProblem => {
    const isMissingNumber = Math.random() < 0.5;
    const length = difficulty === 'hard' ? 6 : 5;

    let start = 1, diff = 2, multiplier = 2;
    let description = "Add 2 to each number.";
    let sequence: number[] = [];

    switch (difficulty) {
        case 'easy':
            start = Math.floor(Math.random() * 10) + 1;
            diff = Math.floor(Math.random() * 3) + 2; // 2, 3, 4
            description = `Hint: The pattern is adding ${diff}.`;
            break;
        case 'medium':
            start = Math.floor(Math.random() * 20) + 1;
            if (Math.random() > 0.5) {
                diff = (Math.floor(Math.random() * 4) + 2) * -1; // -2 to -5
                description = `Hint: The pattern is subtracting ${Math.abs(diff)}.`;
            } else {
                diff = Math.floor(Math.random() * 5) + 3; // 3 to 7
                description = `Hint: The pattern is adding ${diff}.`;
            }
            break;
        case 'hard':
            start = Math.floor(Math.random() * 5) + 1;
            if (Math.random() > 0.5) {
                multiplier = Math.floor(Math.random() * 2) + 2; // 2 or 3
                description = `Hint: The pattern is multiplying by ${multiplier}.`;
                sequence.push(start);
                for (let i = 1; i < length; i++) {
                    sequence.push(sequence[i - 1] * multiplier);
                }
            } else {
                diff = Math.floor(Math.random() * 10) + 5; // 5 to 14
                if (Math.random() > 0.5) diff *= -1;
                description = diff > 0 ? `Hint: The pattern adds ${diff}.` : `Hint: The pattern subtracts ${Math.abs(diff)}.`;
            }
            break;
    }

    if (sequence.length === 0) { // If not a geometric sequence
        for (let i = 0; i < length; i++) {
            sequence.push(start + i * diff);
        }
    }

    let answer, displaySequence;
    if (isMissingNumber) {
        const missingIndex = Math.floor(Math.random() * (length - 2)) + 1; // Not first or last
        answer = sequence[missingIndex];
        displaySequence = sequence.map((num, idx) => idx === missingIndex ? "_" : num);
    } else {
        answer = sequence[sequence.length - 1];
        displaySequence = [...sequence.slice(0, -1), "?"];
    }

    return {
        id: `wcn-${Date.now()}`,
        displaySequence,
        answer,
        description,
    };
};

export default function WhatComesNextGame({ onBack, difficulty }: WhatComesNextGameProps) {
    const [problem, setProblem] = useState<SequenceProblem | null>(null);
    const [userAnswer, setUserAnswer] = useState<string>("");
    const [score, setScore] = useState(0);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isCalculatingReward, setIsCalculatingReward] = useState(false);
    const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);

    const { toast } = useToast();
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameContainerRef);

    useEffect(() => {
        enterFullscreen();
    }, [enterFullscreen]);

    const handleExit = () => {
        exitFullscreen();
        onBack();
    }

    const StarRating = ({ rating }: { rating: number }) => (
        <div className="flex justify-center">
            {[...Array(3)].map((_, i) => (
                <Star key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
            ))}
        </div>
    );

    const calculateStars = (finalScore: number) => {
        const percentage = (finalScore / QUESTIONS_PER_ROUND) * 100;
        if (percentage === 100) return 3;
        if (percentage >= 80) return 2;
        if (percentage >= 50) return 1;
        return 0;
    };

    const handleGameOver = useCallback(async (finalScore: number) => {
        setIsGameOver(true);
        setIsCalculatingReward(true);
        // Using a generic ID for stats tracking
        updateGameStats({ gameId: 'whatComesNext', didWin: finalScore === QUESTIONS_PER_ROUND, score: finalScore * 100 });

        try {
            const rewards = await calculateRewards({
                gameId: 'numberSequence', // Re-using existing reward logic for simplicity
                difficulty,
                performanceMetrics: { score: finalScore, maxScore: QUESTIONS_PER_ROUND }
            });
            const earned = applyRewards(rewards.sPoints, rewards.sCoins, `What Comes Next? (${difficulty})`);
            const stars = calculateStars(finalScore);
            setLastReward({ points: earned.points, coins: earned.coins, stars });
        } catch (error) {
            console.error("Reward calculation failed:", error);
            toast({ variant: "destructive", title: 'Reward Error' });
        } finally {
            setIsCalculatingReward(false);
        }
    }, [difficulty, toast]);

    const loadNewProblem = useCallback(() => {
        setProblem(generateProblem(difficulty));
        setUserAnswer("");
        setFeedback(null);
    }, [difficulty]);

    const resetGame = useCallback(() => {
        setScore(0);
        setQuestionsAnswered(0);
        setIsGameOver(false);
        setLastReward(null);
        setIsCalculatingReward(false);
        loadNewProblem();
    }, [loadNewProblem]);

    useEffect(() => {
        resetGame();
    }, [resetGame]);

    const handleSubmitAnswer = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!problem || isGameOver || feedback) return;

        const answerNum = parseInt(userAnswer, 10);
        if (isNaN(answerNum)) {
            toast({ variant: "destructive", title: "Invalid Input", description: "Your answer must be a number." });
            return;
        }

        const isCorrect = answerNum === problem.answer;
        setFeedback(isCorrect ? "Correct!" : `Not quite! The answer was ${problem.answer}.`);

        if (isCorrect) {
            toast({ title: "Correct!", className: "bg-green-500 text-white" });
        } else {
            toast({ variant: "destructive", title: "Incorrect!", description: `The correct answer was ${problem.answer}.` });
        }

        setTimeout(() => {
            setQuestionsAnswered(prevCount => {
                const newCount = prevCount + 1;
                setScore(prevScore => {
                    const newScore = isCorrect ? prevScore + 1 : prevScore;
                    if (newCount >= QUESTIONS_PER_ROUND) {
                        handleGameOver(newScore);
                    } else {
                        loadNewProblem();
                    }
                    return newScore;
                });
                return newCount;
            });
        }, isCorrect ? 1500 : 3000);
    }, [problem, userAnswer, isGameOver, feedback, toast, handleGameOver, loadNewProblem]);

    const renderGameOverView = () => (
        <div className="text-center p-6 bg-purple-100 rounded-lg shadow-inner">
            {isCalculatingReward ? (
                <div className="flex flex-col items-center justify-center gap-2 pt-4 min-h-[150px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Calculating your rewards...</p>
                </div>
            ) : lastReward ? (
                <div className="flex flex-col items-center gap-3 text-center min-h-[150px]">
                    <StarRating rating={lastReward.stars} />
                    <p className="text-xl font-semibold text-accent mt-2">
                        Final Score: {score}/{QUESTIONS_PER_ROUND}
                    </p>
                    <div className="flex items-center gap-6 mt-1">
                        <span className="flex items-center font-bold text-xl">
                            +{lastReward.points} <SPointsIcon className="ml-1.5 h-6 w-6 text-yellow-400" />
                        </span>
                        <span className="flex items-center font-bold text-xl">
                            +{lastReward.coins} <SCoinsIcon className="ml-1.5 h-6 w-6 text-amber-500" />
                        </span>
                    </div>
                </div>
            ) : (
                <div className="min-h-[150px]">
                    <Award className="mx-auto h-16 w-16 text-yellow-500 mb-3" />
                    <h2 className="text-2xl font-bold text-purple-700">Round Over!</h2>
                    <p className="text-lg text-purple-600 mt-1">{`Your final score is ${score}/${QUESTIONS_PER_ROUND}.`}</p>
                </div>
            )}
            <Button onClick={resetGame} className="mt-6 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={isCalculatingReward}>
                <RotateCcw className="mr-2 h-5 w-5" /> Play Again
            </Button>
        </div>
    );

    return (
        <div ref={gameContainerRef} className={cn("w-full h-full flex items-center justify-center", isFullscreen && "bg-background")}>
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="bg-primary/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Wand size={28} className="text-primary" />
                            <CardTitle className="text-2xl font-bold text-primary">What Comes Next?</CardTitle>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleExit}>
                            <Shrink size={16} className="mr-1" /> Exit
                        </Button>
                    </div>
                    <CardDescription className="text-center text-md text-foreground/80 pt-2">
                        Question: {Math.min(questionsAnswered + 1, QUESTIONS_PER_ROUND)}/{QUESTIONS_PER_ROUND} | Score: {score} | Difficulty: <span className="capitalize">{difficulty}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {isGameOver ? renderGameOverView() : problem && (
                        <>
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <p className="text-3xl font-bold text-foreground tracking-wider">
                                    {problem.displaySequence.map((item, index) => (
                                        <span key={index} className={cn("mx-1", (item === "?" || item === "_") && "text-destructive font-black")}>
                                            {item}{index < problem.displaySequence.length - 1 ? ", " : ""}
                                        </span>
                                    ))}
                                </p>
                                {problem.description && !feedback && (
                                    <p className="text-sm text-muted-foreground mt-2">{problem.description}</p>
                                )}
                            </div>
                            <form onSubmit={handleSubmitAnswer} className="space-y-4">
                                <div>
                                    <Label htmlFor="sequenceAnswer" className="text-base font-medium flex items-center mb-1">
                                        <Hash className="mr-2 h-5 w-5 text-muted-foreground" /> Answer:
                                    </Label>
                                    <Input
                                        id="sequenceAnswer"
                                        type="number"
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        placeholder="Enter the number"
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
                </CardContent>
            </Card>
        </div>
    );
}
