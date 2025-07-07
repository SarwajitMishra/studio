
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Blocks, Eye, Pointer, RotateCw, ArrowLeft, Shield, Star, Gem, Check, X, Award,
  Apple, Heart, Sun, Cloud, Gift, Loader2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { updateGameStats } from "@/lib/progress";
import { S_COINS_ICON as SCoinsIcon, S_POINTS_ICON as SPointsIcon } from '@/lib/constants';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'setup' | 'memorize' | 'build' | 'result';

interface IconData {
  name: string;
  Icon: LucideIcon;
  color: string;
}

const ICONS: IconData[] = [
  { name: 'Apple', Icon: Apple, color: 'text-red-500' },
  { name: 'Star', Icon: Star, color: 'text-yellow-400' },
  { name: 'Heart', Icon: Heart, color: 'text-pink-500' },
  { name: 'Sun', Icon: Sun, color: 'text-orange-400' },
  { name: 'Cloud', Icon: Cloud, color: 'text-sky-500' },
  { name: 'Gift', Icon: Gift, color: 'text-green-500' },
];

const DIFFICULTY_CONFIG: Record<Difficulty, { gridSize: number, memorizeTime: number, icons: number }> = {
  easy: { gridSize: 3, memorizeTime: 3000, icons: 4 },
  medium: { gridSize: 4, memorizeTime: 5000, icons: 5 },
  hard: { gridSize: 5, memorizeTime: 7000, icons: 6 },
};

const generatePattern = (gridSize: number, numIcons: number): (IconData | null)[] => {
  const availableIcons = ICONS.slice(0, numIcons);
  const pattern: (IconData | null)[] = [];
  for (let i = 0; i < gridSize * gridSize; i++) {
    if (Math.random() > 0.4) { // 60% chance of being an icon
      pattern.push(availableIcons[Math.floor(Math.random() * availableIcons.length)]);
    } else {
      pattern.push(null);
    }
  }
  return pattern;
};

export default function PatternBuilderPage() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [gameState, setGameState] = useState<GameState>('setup');
  
  const [pattern, setPattern] = useState<(IconData | null)[]>([]);
  const [userPattern, setUserPattern] = useState<(IconData | null)[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<IconData>(ICONS[0]);
  const [score, setScore] = useState(0);
  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const { toast } = useToast();

  const config = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;

  const startNewLevel = useCallback(() => {
    if (!config) return;
    const newPattern = generatePattern(config.gridSize, config.icons);
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
    setSelectedIcon(ICONS[0]);
    const newPattern = generatePattern(newConfig.gridSize, newConfig.icons);
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
    newUserPattern[index] = selectedIcon;
    setUserPattern(newUserPattern);
  };

  const checkPattern = async () => {
    if (!config || !difficulty) return;
    
    setIsCalculatingReward(true);

    let correctCells = 0;
    for(let i = 0; i < pattern.length; i++) {
      if(pattern[i]?.name === userPattern[i]?.name) {
        correctCells++;
      }
    }
    const accuracy = (correctCells / (config.gridSize * config.gridSize)) * 100;
    setScore(accuracy);

    updateGameStats({ gameId: 'patternBuilder', didWin: accuracy >= 75, score: accuracy });

    try {
        const rewards = await calculateRewards({ gameId: 'patternBuilder', difficulty, performanceMetrics: { accuracy } });
        applyRewards(rewards.sPoints, rewards.sCoins, `Pattern Builder round (${difficulty}, ${accuracy.toFixed(0)}% accuracy)`);
        toast({
            title: "Round Complete!",
            description: `You earned ${rewards.sPoints} S-Points and ${rewards.sCoins} S-Coins!`,
        });
    } catch(error) {
        console.error("Error calculating rewards:", error);
        toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
    } finally {
        setIsCalculatingReward(false);
        setGameState('result');
    }
  };

  const getResultContent = () => {
    if (score >= 95) return { title: "Perfect!", description: "Incredible memory!", Icon: Award };
    if (score >= 75) return { title: "Great Job!", description: "You have a sharp memory!", Icon: Star };
    if (score >= 50) return { title: "Good Try!", description: "Keep practicing to improve!", Icon: Check };
    return { title: "Keep Going!", description: "Practice makes perfect!", Icon: X };
  };
  
  const renderGrid = (gridData: (IconData | null)[], isInteractive: boolean) => {
    if (!config) return null;
    return (
       <div
            className="grid gap-1 bg-muted p-2 rounded-lg"
            style={{ gridTemplateColumns: 'repeat(' + config.gridSize + ', minmax(0, 1fr))' }}
        >
            {gridData.map((iconData, index) => {
              const IconComponent = iconData?.Icon;
              return (
                <button
                    key={index}
                    onClick={() => isInteractive && handleCellClick(index)}
                    disabled={!isInteractive}
                    className={cn(
                        "w-12 h-12 sm:w-16 sm:h-16 rounded-md transition-colors duration-200 flex items-center justify-center bg-card",
                        isInteractive && "hover:ring-2 ring-primary"
                    )}
                >
                  {IconComponent && <IconComponent className={cn("w-2/3 h-2/3", iconData.color)} />}
                </button>
              );
            })}
        </div>
    );
  };

  if (gameState === 'setup' || !config) {
     return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
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
            <CardFooter>
                <Button asChild variant="ghost" className="w-full">
                    <Link href="/"><ArrowLeft className="mr-2"/> Back to Menu</Link>
                </Button>
            </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
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
                          {ICONS.slice(0, config.icons).map(iconData => (
                              <button
                                  key={iconData.name}
                                  onClick={() => setSelectedIcon(iconData)}
                                  className={cn("w-12 h-12 rounded-lg border-2 flex items-center justify-center bg-card", selectedIcon.name === iconData.name ? 'ring-4 ring-primary' : 'border-transparent')}
                                  aria-label={`Select ${iconData.name}`}
                              >
                                <iconData.Icon className={cn("w-8 h-8", iconData.color)} />
                              </button>
                          ))}
                      </div>
                      <Button onClick={checkPattern} className="mt-4 w-full bg-accent text-accent-foreground" disabled={isCalculatingReward}>
                        {isCalculatingReward ? <Loader2 className="mr-2 animate-spin"/> : <Check className="mr-2"/>}
                        Check My Pattern
                      </Button>
                  </div>
              )}
              {gameState === 'result' && (
                  <div className="text-center p-4 bg-muted rounded-lg space-y-3">
                    {(() => {
                    const ResultIcon = getResultContent().Icon;
                    return <ResultIcon size={48} className="mx-auto text-primary" />;
                    })()}
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
    </div>
  );
}
