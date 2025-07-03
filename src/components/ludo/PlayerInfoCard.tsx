
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Cpu } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
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
  
  const DICE_ICONS: Record<number, React.ElementType> = {
    1: LucideIcons.Dice1, 2: LucideIcons.Dice2, 3: LucideIcons.Dice3, 4: LucideIcons.Dice4, 5: LucideIcons.Dice5, 6: LucideIcons.Dice6
  };
  
  let DiceIconToRender = LucideIcons.Dice6;
  let diceButtonStyling = "text-muted-foreground opacity-50";
  let isDiceButtonClickable = false;

  if (isCurrentPlayer && player) {
    if (isRolling && diceValue) {
      DiceIconToRender = DICE_ICONS[diceValue] || LucideIcons.Dice6;
      diceButtonStyling = "text-muted-foreground animate-spin";
    } else if (diceValue) {
      DiceIconToRender = DICE_ICONS[diceValue] || LucideIcons.Dice6;
      diceButtonStyling = cn("animate-gentle-bounce", playerSpecificConfig.textClass);
    } else {
      DiceIconToRender = LucideIcons.Dice6;
      diceButtonStyling = cn("cursor-pointer hover:opacity-75", playerSpecificConfig.textClass);
    }
    if (!player.isAI && gameView === 'playing' && !isRolling && (diceValue === null || player.hasRolledSix)) {
      isDiceButtonClickable = true;
    }
  } else {
    DiceIconToRender = LucideIcons.Dice6;
    diceButtonStyling = "text-muted-foreground opacity-30";
  }

  const panelClasses = cn(
    "flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg shadow-md border border-primary/30 bg-card/90 backdrop-blur-sm",
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
          "border-2 border-dashed rounded-lg shadow-sm flex items-center justify-center",
          "h-10 w-10 sm:h-12 sm:w-12",
          isDiceButtonClickable
            ? cn("cursor-pointer", playerSpecificConfig.baseClass + "/30", `hover:${playerSpecificConfig.baseClass}/50`)
            : "border-muted-foreground/30 cursor-not-allowed opacity-70"
        )}
        onClick={() => {
          if (isDiceButtonClickable) onDiceRoll();
        }}
        disabled={!isDiceButtonClickable || gameView === 'gameOver'}
        aria-label={`Roll dice for ${player.name}`}
      >
        <DiceIconToRender size={24} className={diceButtonStyling} />
      </Button>
    </div>
  );
};
