
"use client";

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Player, GameView } from '@/lib/ludo/types';
import { PLAYER_CONFIG } from '@/lib/ludo/engine';

interface PlayerInfoCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  diceValue: number | null;
  isRolling: boolean;
  onDiceRoll: () => void;
  gameView: GameView;
}

export const PlayerInfoCard: React.FC<PlayerInfoCardProps> = ({ player, isCurrentPlayer, diceValue, isRolling, onDiceRoll, gameView }) => {
  const playerSpecificConfig = PLAYER_CONFIG[player.color];
  
  const DICE_IMAGE_URLS: Record<number, string> = {
    1: '/images/ludo/dice-1.png',
    2: '/images/ludo/dice-2.png',
    3: '/images/ludo/dice-3.png',
    4: '/images/ludo/dice-4.png',
    5: '/images/ludo/dice-5.png',
    6: '/images/ludo/dice-6.png',
  };
  
  let diceImageUrlToShow = DICE_IMAGE_URLS[6];
  if (isCurrentPlayer && player) {
    if (diceValue) {
      diceImageUrlToShow = DICE_IMAGE_URLS[diceValue] || DICE_IMAGE_URLS[6];
    }
  }

  let isDiceButtonClickable = false;
  if (isCurrentPlayer && player) {
    if (!player.isAI && gameView === 'playing' && !isRolling && (diceValue === null || player.hasRolledSix)) {
      isDiceButtonClickable = true;
    }
  }

  const panelClasses = cn(
    "flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg shadow-lg border-2 bg-card/90 backdrop-blur-sm transition-all duration-300",
    isCurrentPlayer ? "border-yellow-400 ring-4 ring-yellow-400/50 animate-pulse" : "border-primary/20",
    playerSpecificConfig.baseClass + "/20",
    "w-36 sm:w-48 h-auto"
  );
  
  const nameClasses = cn(
    "text-sm sm:text-base font-semibold truncate mb-2 text-center", 
    playerSpecificConfig.textClass
  );

  return (
    <div className={panelClasses}>
      <p className={nameClasses} title={player.name}>
        {player.name} {player.isAI && <Cpu size={14} className="inline ml-1"/>}
      </p>
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "border-2 border-dashed rounded-lg shadow-sm flex items-center justify-center p-0",
          "h-10 w-10 sm:h-12 sm:w-12",
          isDiceButtonClickable
            ? cn("cursor-pointer", playerSpecificConfig.baseClass + "/30", `hover:${playerSpecificConfig.baseClass}/50`)
            : "border-muted-foreground/30 cursor-not-allowed opacity-70",
        )}
        onClick={() => {
          if (isDiceButtonClickable) onDiceRoll();
        }}
        disabled={!isDiceButtonClickable || gameView === 'gameOver'}
        aria-label={`Roll dice for ${player.name}`}
      >
        <Image
            src={diceImageUrlToShow}
            alt={`Dice showing ${diceValue || 'face'}`}
            width={32}
            height={32}
            className={cn(isRolling ? "animate-spin" : "")}
            data-ai-hint={`dice ${diceValue || 'six'}`}
        />
      </Button>
    </div>
  );
};
