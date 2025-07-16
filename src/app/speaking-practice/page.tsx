
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Ear, Bot, Timer, User } from 'lucide-react';
import SpeakingPracticeGame from '@/components/speaking-practice/SpeakingPracticeGame';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import CustomChatIcon from '@/components/icons/custom-chat-icon';

export type VoiceOption = 'male' | 'female';

export default function SpeakingPracticeSetup() {
  const [view, setView] = useState<'setup' | 'playing'>('setup');
  const [duration, setDuration] = useState<number>(3);
  const [voice, setVoice] = useState<VoiceOption>('female');

  const handleStart = () => {
    setView('playing');
  };
  
  const handleBack = () => {
      setView('setup');
  }

  if (view === 'playing') {
    return <SpeakingPracticeGame sessionDuration={duration} voice={voice} onBack={handleBack} />;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="bg-primary/10 text-center">
          <CustomChatIcon size={64} className="mx-auto" />
          <CardTitle className="text-3xl font-bold text-primary mt-2">English Speaking Practice</CardTitle>
          <CardDescription>
            Have a conversation with Shravya AI to improve your speaking skills.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="space-y-4">
            <Label className="text-lg font-semibold flex items-center justify-center">
              <Timer className="mr-2" /> Session Duration: <span className="text-accent font-bold ml-2">{duration} Minute{duration > 1 && 's'}</span>
            </Label>
            <Slider
              value={[duration]}
              onValueChange={(value) => setDuration(value[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-4">
            <Label className="text-lg font-semibold flex items-center justify-center">
              <Bot className="mr-2" /> Shravya AI's Voice
            </Label>
            <RadioGroup
              value={voice}
              onValueChange={(val) => setVoice(val as VoiceOption)}
              className="grid grid-cols-2 gap-4"
            >
               <div>
                  <RadioGroupItem value="female" id="voice-female" className="sr-only" />
                  <Label
                    htmlFor="voice-female"
                    className={cn(
                        "flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        voice === 'female' && "border-primary ring-2 ring-primary"
                    )}
                  >
                     <User size={20}/> Female
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="male" id="voice-male" className="sr-only" />
                  <Label
                    htmlFor="voice-male"
                     className={cn(
                        "flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        voice === 'male' && "border-primary ring-2 ring-primary"
                    )}
                  >
                    <User size={20}/> Male
                  </Label>
                </div>
            </RadioGroup>
          </div>

          <Button size="lg" className="w-full text-lg" onClick={handleStart}>
            Start Conversation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
