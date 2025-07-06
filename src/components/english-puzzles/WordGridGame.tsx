
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutGrid, ArrowLeft, RotateCw, Check } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface WordGridGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

const DICTIONARY = {
  easy: ['cat', 'dog', 'sun', 'run', 'fun', 'egg', 'bed', 'red', 'ten', 'pen'],
  medium: ['play', 'game', 'word', 'grid', 'find', 'time', 'apple', 'ball', 'tree'],
  hard: ['puzzle', 'search', 'letter', 'square', 'boggle', 'player', 'challenge', 'expert'],
};

const DICE = {
  easy: [ "AACIOT", "ABILTY", "ABJMOQ", "ACDEMP", "ACELRS", "ADENVZ", "AHMORS", "BIFORX", "DENOSW", "DKNOTU", "EEFHIY", "EGKLUY", "EGINTV", "EHINPS", "ELPSTU", "GILRUW",],
  medium: [ "AACIOT", "ABILTY", "ABJMOQ", "ACDEMP", "ACELRS", "ADENVZ", "AHMORS", "BIFORX", "DENOSW", "DKNOTU", "EEFHIY", "EGKLUY", "EGINTV", "EHINPS", "ELPSTU", "GILRUW",],
  hard: [ "AACIOT", "ABILTY", "ABJMOQ", "ACDEMP", "ACELRS", "ADENVZ", "AHMORS", "BIFORX", "DENOSW", "DKNOTU", "EEFHIY", "EGKLUY", "EGINTV", "EHINPS", "ELPSTU", "GILRUW",],
};

const GRID_SIZE = 4;
const GAME_DURATION_S = 120; // 2 minutes

const generateGrid = (difficulty: Difficulty): string[][] => {
  const diceSet = DICE[difficulty];
  const shuffledDice = [...diceSet].sort(() => 0.5 - Math.random());
  const grid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
  
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const row = Math.floor(i / GRID_SIZE);
    const col = i % GRID_SIZE;
    const die = shuffledDice[i];
    let letter = die[Math.floor(Math.random() * 6)];
    if (letter === 'Q') letter = 'Qu';
    grid[row][col] = letter;
  }
  return grid;
};

export default function WordGridGame({ onBack, difficulty }: WordGridGameProps) {
  const [grid, setGrid] = useState<string[][]>([]);
  const [currentPath, setCurrentPath] = useState<{r: number, c: number}[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_S);
  const [isGameOver, setIsGameOver] = useState(false);
  
  const { toast } = useToast();
  const dictionary = useMemo(() => new Set([...DICTIONARY.easy, ...DICTIONARY.medium, ...DICTIONARY.hard]), []);

  const resetGame = useCallback(() => {
    setGrid(generateGrid(difficulty));
    setCurrentPath([]);
    setCurrentWord('');
    setFoundWords([]);
    setScore(0);
    setTimeLeft(GAME_DURATION_S);
    setIsGameOver(false);
  }, [difficulty]);
  
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft <= 0 && !isGameOver) {
      setIsGameOver(true);
      toast({ title: "Time's Up!", description: `Your final score is ${score}.`});
    }
  }, [timeLeft, isGameOver, score, toast]);

  const handleCellClick = (r: number, c: number) => {
    if (isGameOver) return;
    
    const lastPos = currentPath[currentPath.length - 1];
    const isAlreadyInPath = currentPath.some(pos => pos.r === r && pos.c === c);

    if (isAlreadyInPath) return; // Cannot reuse a letter in the same word

    if (currentPath.length > 0) {
      const isAdjacent = Math.abs(lastPos.r - r) <= 1 && Math.abs(lastPos.c - c) <= 1;
      if (!isAdjacent) return; // Must be an adjacent letter
    }

    const newPath = [...currentPath, {r, c}];
    setCurrentPath(newPath);
    setCurrentWord(w => w + grid[r][c].toLowerCase());
  };
  
  const submitWord = () => {
    const wordToSubmit = currentWord.replace('qu', 'q');
    if (wordToSubmit.length < 3) {
      toast({ variant: 'destructive', title: "Too Short!", description: "Words must be at least 3 letters long." });
    } else if (foundWords.includes(currentWord)) {
      toast({ variant: 'destructive', title: "Already Found!", description: "You've already found that word." });
    } else if (dictionary.has(wordToSubmit)) {
        setFoundWords(prev => [currentWord, ...prev]);
        const points = Math.max(1, wordToSubmit.length - 2);
        setScore(s => s + points);
        toast({ title: "Word Found!", description: `+${points} points for "${currentWord}"!`, className: "bg-green-500 text-white" });
    } else {
        toast({ variant: 'destructive', title: "Not a word", description: `"${currentWord}" is not in our dictionary.` });
    }

    setCurrentPath([]);
    setCurrentWord('');
  };

  return (
    <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <LayoutGrid size={28} className="text-primary" />
                    <CardTitle className="text-2xl font-bold text-primary">Word Grid</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft size={16} className="mr-1" /> Back
                </Button>
            </div>
            <CardDescription className="text-center text-md text-foreground/80 pt-2 flex justify-between items-center px-2">
                <span>Score: {score}</span>
                <span>Time: {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</span>
            </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
            {isGameOver ? (
                <div className='text-center space-y-4'>
                    <h3 className='text-2xl font-bold'>Time's Up!</h3>
                    <p className='text-xl'>Final Score: {score}</p>
                    <Button onClick={resetGame}><RotateCw className='mr-2' />Play Again</Button>
                </div>
            ) : (
                <>
                <div className="grid grid-cols-4 gap-2">
                    {grid.flat().map((letter, index) => {
                        const r = Math.floor(index / GRID_SIZE);
                        const c = index % GRID_SIZE;
                        const inPath = currentPath.some(pos => pos.r === r && pos.c === c);
                        return (
                            <button
                                key={index}
                                onClick={() => handleCellClick(r, c)}
                                className={cn("w-16 h-16 text-2xl font-bold border-2 rounded-lg flex items-center justify-center transition-colors",
                                inPath ? "bg-yellow-400 border-yellow-600 text-white" : "bg-card hover:bg-muted"
                                )}
                            >
                                {letter}
                            </button>
                        );
                    })}
                </div>
                <div className='text-center h-10 border rounded-lg flex items-center justify-center text-2xl font-mono tracking-widest bg-muted'>
                    {currentWord || "..."}
                </div>
                 <div className='flex gap-2'>
                    <Button variant="destructive" className='w-full' onClick={() => { setCurrentPath([]); setCurrentWord(''); }}>Clear</Button>
                    <Button className='w-full bg-accent text-accent-foreground' onClick={submitWord} disabled={currentWord.length < 3}><Check className='mr-2'/>Submit</Button>
                 </div>
                </>
            )}

            <div>
                <h4 className='font-semibold mb-2'>Found Words ({foundWords.length})</h4>
                <ScrollArea className="h-40 w-full border rounded-md p-2">
                    {foundWords.length > 0 ? foundWords.map(word => (
                        <p key={word} className="font-mono">{word}</p>
                    )) : <p className="text-muted-foreground text-center pt-8">No words found yet!</p>}
                </ScrollArea>
            </div>
        </CardContent>
    </Card>
  );
}

