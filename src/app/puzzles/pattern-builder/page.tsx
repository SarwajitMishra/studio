
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Blocks, Eye, Pointer, RotateCw, ArrowLeft, Shield, Star, Gem, Check, X } from 'lucide-react';
import { cn } from "@/lib/utils";

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'setup' | 'memorize' | 'build' | 'result';
type Color = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

const COLORS: Record<Color, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

const DIFFICULTY_CONFIG: Record<Difficulty, { gridSize: number, memorizeTime: number, colors: number }> = {
  easy: { gridSize: 3, memorizeTime: 3000, colors: 3 },
  medium: { gridSize: 4, memorizeTime: 5000, colors: 4 },
  hard: { gridSize: 5, memorizeTime: 7000, colors: 6 },
};

const generatePattern = (gridSize: number, numColors: number): (Color | null)[] => {
  const availableColors = Object.keys(COLORS).slice(0, numColors) as Color[];
  const pattern: (Color | null)[] = [];
  for (let i = 0; i < gridSize * gridSize; i++) {
    if (Math.random() > 0.4) { // 60% chance of being colored
      pattern.push(availableColors[Math.floor(Math.random() * availableColors.length)]);
    } else {
      pattern.push(null);
    }
  }
  return pattern;
};

export default function PatternBuilderPage() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [gameState, setGameState] = useState<GameState>('setup');
  
  const [pattern, setPattern] = useState<(Color | null)[]>([]);
  const [userPattern, setUserPattern] = useState<(Color | null)[]>([]);
  const [selectedColor, setSelectedColor] = useState<Color>('red');
  const [score, setScore] = useState(0);

  const config = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;

  const startNewLevel = useCallback(() => {
    if (!config) return;
    const newPattern = generatePattern(config.gridSize, config.colors);
    setPattern(newPattern);
    setUserPattern(Array(config.gridSize * config.gridSize).fill(null));
    setGameState('memorize');

    setTimeout(() => {
      setGameState('build');
    }, config.memorizeTime);
  }, [config]);

  const handleDifficultySelect = (diff: Difficulty) => {
    setDifficulty(diff);
    setScore(0);
    const newConfig = DIFFICULTY_CONFIG[diff];
    const newPattern = generatePattern(newConfig.gridSize, newConfig.colors);
    setPattern(newPattern);
    setUserPattern(Array(newConfig.gridSize * newConfig.gridSize).fill(null));
    setGameState('memorize');
    
    setTimeout(() => {
      setGameState('build');
    }, newConfig.memorizeTime);
  };
  
  const handleCellClick = (index: number) => {
    if (gameState !== 'build') return;
    const newUserPattern = [...userPattern];
    newUserPattern[index] = selectedColor;
    setUserPattern(newUserPattern);
  };

  const checkPattern = () => {
    if (!config) return;
    let correctCells = 0;
    for(let i = 0; i < pattern.length; i++) {
      if(pattern[i] === userPattern[i]) {
        correctCells++;
      }
    }
    const accuracy = (correctCells / pattern.length) * 100;
    setScore(accuracy);
    setGameState('result');
  };

  const getResultContent = () => {
    if (score >= 95) return { title: "Perfect!", description: "Incredible memory!", Icon: Award };
    if (score >= 75) return { title: "Great Job!", description: "You have a sharp memory!", Icon: Star };
    if (score >= 50) return { title: "Good Try!", description: "Keep practicing to improve!", Icon: Check };
    return { title: "Keep Going!", description: "Practice makes perfect!", Icon: X };
  };
  
  const renderGrid = (gridData: (Color | null)[], isInteractive: boolean) => {
    if (!config) return null;
    return (
       <div
            className="grid gap-1 bg-muted p-2 rounded-lg"
            style={{ gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))` }}
        >
            {gridData.map((color, index) => (
                <button
                    key={index}
                    onClick={() => isInteractive && handleCellClick(index)}
                    disabled={!isInteractive}
                    className={cn(
                        "w-12 h-12 sm:w-16 sm:h-16 rounded-md transition-colors duration-200",
                        color ? COLORS[color] : "bg-card",
                        isInteractive && "hover:ring-2 ring-primary"
                    )}
                />
            ))}
        </div>
    );
  };

  if (gameState === 'setup' || !config) {
     return (
        <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="bg-primary/10 text-center">
                <CardTitle className="text-3xl font-bold text-primary">Pattern Builder</CardTitle>
                <CardDescription>Memorize the pattern, then build it!</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-6">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                    <Button key={d} onClick={() => handleDifficultySelect(d)} className="text-lg py-6 capitalize">
                        {d === 'easy' && <Shield className="mr-2" />}
                        {d === 'medium' && <Star className="mr-2" />}
                        {d === 'hard' && <Gem className="mr-2" />}
                        {d} ({DIFFICULTY_CONFIG[d].gridSize}x{DIFFICULTY_CONFIG[d].gridSize})
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Blocks size={28} className="text-primary" />
                    <CardTitle className="text-2xl font-bold text-primary">Pattern Builder</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => setGameState('setup')}>
                    <ArrowLeft size={16} className="mr-1" /> Change Difficulty
                </Button>
            </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
            {gameState === 'memorize' && (
                <div className="text-center space-y-4">
                    <p className="font-bold text-yellow-800 animate-pulse flex items-center justify-center gap-2 text-lg">
                        <Eye size={22} /> Memorize the pattern!
                    </p>
                    {renderGrid(pattern, false)}
                </div>
            )}
            {gameState === 'build' && (
                <div className="text-center space-y-4">
                    <p className="font-bold text-green-800 flex items-center justify-center gap-2 text-lg">
                        <Pointer size={22} /> Your turn! Recreate the pattern.
                    </p>
                    {renderGrid(userPattern, true)}
                    <div className="flex justify-center gap-2 flex-wrap pt-4">
                        {Object.keys(COLORS).slice(0, config.colors).map(c => (
                            <button
                                key={c}
                                onClick={() => setSelectedColor(c as Color)}
                                className={cn("w-10 h-10 rounded-full border-2", COLORS[c as Color], selectedColor === c ? 'ring-4 ring-primary' : 'border-transparent')}
                            />
                        ))}
                    </div>
                    <Button onClick={checkPattern} className="mt-4 w-full bg-accent text-accent-foreground">Check My Pattern</Button>
                </div>
            )}
            {gameState === 'result' && (
                 <div className="text-center p-4 bg-muted rounded-lg space-y-3">
                    <getResultContent().Icon size={48} className="mx-auto text-primary" />
                    <h3 className="text-2xl font-bold">{getResultContent().title}</h3>
                    <p className="text-lg">Accuracy: <span className="font-bold text-accent">{score.toFixed(0)}%</span></p>
                    <p>{getResultContent().description}</p>
                    <div className="flex justify-center items-center gap-4 pt-4">
                      <div><h4 className='font-semibold'>Original</h4>{renderGrid(pattern, false)}</div>
                      <div><h4 className='font-semibold'>Your Build</h4>{renderGrid(userPattern, false)}</div>
                    </div>
                    <Button onClick={startNewLevel} className="mt-4 bg-accent text-accent-foreground">
                        <RotateCw className="mr-2" /> Play Next Level
                    </Button>
                </div>
            )}
        </CardContent>
    </Card>
  );
}

