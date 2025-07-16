
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Ear, ArrowLeft, Timer, User, Bot } from 'lucide-react';
import SpeakingPracticeGame from '@/components/speaking-practice/SpeakingPracticeGame';

type SessionDuration = 1 | 3 | 5; // in minutes
type VoiceOption = 'male' | 'female';

export default function SpeakingPracticeSetup() {
  const [view, setView] = useState<'setup' | 'playing'>('setup');
  const [duration, setDuration] = useState<SessionDuration>(3);
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
          <Ear size={48} className="mx-auto text-primary" />
          <CardTitle className="text-3xl font-bold text-primary mt-2">English Speaking Practice</CardTitle>
          <CardDescription>
            Have a conversation with Shravya AI to improve your speaking skills.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="space-y-4">
            <Label className="text-lg font-semibold flex items-center justify-center">
              <Timer className="mr-2" /> Session Duration
            </Label>
            <RadioGroup
              value={String(duration)}
              onValueChange={(val) => setDuration(Number(val) as SessionDuration)}
              className="grid grid-cols-3 gap-4"
            >
              {[1, 3, 5].map((d) => (
                <div key={d}>
                  <RadioGroupItem value={String(d)} id={`duration-${d}`} className="sr-only" />
                  <Label
                    htmlFor={`duration-${d}`}
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="text-2xl font-bold">{d}</span>
                    <span className="text-sm">Minute{d > 1 && 's'}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
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
                    className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                  >
                     <User size={20}/> Female
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="male" id="voice-male" className="sr-only" />
                  <Label
                    htmlFor="voice-male"
                    className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
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
