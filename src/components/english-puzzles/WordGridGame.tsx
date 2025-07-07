
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutGrid, ArrowLeft, RotateCw, Check, Lightbulb } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { updateGameStats } from "@/lib/progress";

interface WordGridGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

const DICTIONARY = {
  easy: ['cat', 'dog', 'sun', 'run', 'fun', 'egg', 'bed', 'red', 'ten', 'pen', 'art', 'see', 'eat', 'tea', 'rat'],
  medium: ['play', 'game', 'word', 'grid', 'find', 'time', 'apple', 'ball', 'tree', 'star', 'moon', 'fish', 'hand', 'foot', 'book', 'read', 'sand', 'land', 'part'],
  hard: ['puzzle', 'search', 'letter', 'square', 'boggle', 'player', 'challenge', 'expert', 'happy', 'water', 'earth', 'magic', 'plant', 'great', 'start'],
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

// Boggle solver using DFS
const solveGrid = (grid: string[][], dictionary: Set<string>): Set<string> => {
    const words = new Set<string>();
    const visited = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

    function dfs(r: number, c: number, currentWord: string) {
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || visited[r][c]) {
            return;
        }

        const newWord = (currentWord + grid[r][c]).toLowerCase();
        const checkWord = newWord.replace('qu', 'q');

        if (checkWord.length >= 3 && dictionary.has(checkWord)) {
            words.add(newWord);
        }

        visited[r][c] = true;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                dfs(r + dr, c + dc, newWord);
            }
        }
        visited[r][c] = false; // Backtrack
    }

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            dfs(r, c, "");
        }
    }
    return words;
}

export default function WordGridGame({ onBack, difficulty }: WordGridGameProps) {
  const [grid, setGrid] = useState<string[][]>([]);
  const [currentPath, setCurrentPath] = useState<{r: number, c: number}[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [allWords, setAllWords] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_S);
  const [isGameOver, setIsGameOver] = useState(false);
  
  const { toast } = useToast();
  const dictionary = useMemo(() => new Set([...DICTIONARY.easy, ...DICTIONARY.medium, ...DICTIONARY.hard]), []);

  const resetGame = useCallback(() => {
    const newGrid = generateGrid(difficulty);
    setGrid(newGrid);
    setAllWords(solveGrid(newGrid, dictionary));
    setCurrentPath([]);
    setCurrentWord('');
    setFoundWords([]);
    setScore(0);
    setTimeLeft(GAME_DURATION_S);
    setIsGameOver(false);
  }, [difficulty, dictionary]);
  
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft <= 0 && !isGameOver) {
      setIsGameOver(true);
      updateGameStats({ gameId: 'easy-english', didWin: true, score });
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
    setCurrentWord(w => w + grid[r][c]);
  };
  
  const submitWord = () => {
    const lowerCaseWord = currentWord.toLowerCase();
    const checkWord = lowerCaseWord.replace('qu', 'q');
    
    if (checkWord.length < 3) {
      toast({ variant: 'destructive', title: "Too Short!", description: "Words must be at least 3 letters long." });
    } else if (foundWords.includes(lowerCaseWord)) {
      toast({ variant: 'destructive', title: "Already Found!", description: "You've already found that word." });
    } else if (dictionary.has(checkWord)) {
        setFoundWords(prev => [lowerCaseWord, ...prev]);
        const points = Math.max(1, checkWord.length - 2);
        setScore(s => s + points);
        toast({ title: "Word Found!", description: `+${points} points for "${lowerCaseWord}"!`, className: "bg-green-500 text-white" });
    } else {
        toast({ variant: 'destructive', title: "Not a word", description: `"${lowerCaseWord}" is not in our dictionary.` });
    }

    setCurrentPath([]);
    setCurrentWord('');
  };

  const handleHint = () => {
    const remainingWords = new Set(allWords);
    foundWords.forEach(word => remainingWords.delete(word));

    if (remainingWords.size === 0) {
        toast({ title: "Wow!", description: "You've found all the possible words!" });
        return;
    }

    const hintWord = Array.from(remainingWords)[0]; // Just take the first one
    toast({ title: "Hint", description: `Try to find the word: "${hintWord}"` });
  };

  return (
    <Card className="w-full max-w-xl shadow-xl">
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
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-grow space-y-4">
                {isGameOver ? (
                    <div className='text-center space-y-4 flex flex-col items-center justify-center h-full'>
                        <h3 className='text-2xl font-bold'>Time's Up!</h3>
                        <p className='text-xl'>Final Score: {score}</p>
                        <Button onClick={resetGame}><RotateCw className='mr-2' />Play Again</Button>
                    </div>
                ) : (
                    <>
                    <div className="grid grid-cols-4 gap-1">
                        {grid.flat().map((letter, index) => {
                            const r = Math.floor(index / GRID_SIZE);
                            const c = index % GRID_SIZE;
                            const inPath = currentPath.some(pos => pos.r === r && pos.c === c);
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleCellClick(r, c)}
                                    className={cn("w-16 h-16 sm:w-20 sm:h-20 text-3xl font-bold border-2 rounded-lg flex items-center justify-center transition-colors",
                                    inPath ? "bg-yellow-400 border-yellow-600 text-white" : "bg-card hover:bg-muted"
                                    )}
                                >
                                    {letter}
                                </button>
                            );
                        })}
                    </div>
                    <div className='text-center h-12 border rounded-lg flex items-center justify-center text-2xl font-mono tracking-widest bg-muted'>
                        {currentWord || "..."}
                    </div>
                    </>
                )}
            </div>
            <div className="w-full sm:w-56 flex-shrink-0 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={handleHint} disabled={isGameOver}><Lightbulb className="mr-2" /> Hint</Button>
                    <Button variant="outline" onClick={resetGame} disabled={isGameOver}><RotateCw className="mr-2" /> New Grid</Button>
                </div>
                <Button variant="destructive" className="w-full" onClick={() => { setCurrentPath([]); setCurrentWord(''); }}>Clear Word</Button>
                <Button className="w-full bg-accent text-accent-foreground" onClick={submitWord} disabled={currentWord.length < 3}><Check className="mr-2"/>Submit Word</Button>

                <div className="pt-2">
                    <h4 className='font-semibold mb-2 text-center'>Found Words ({foundWords.length})</h4>
                    <ScrollArea className="h-56 w-full border rounded-md p-2">
                        {foundWords.length > 0 ? foundWords.map(word => (
                            <p key={word} className="font-mono text-center">{word}</p>
                        )) : <p className="text-muted-foreground text-center pt-8">No words found yet!</p>}
                    </ScrollArea>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
