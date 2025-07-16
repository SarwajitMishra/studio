
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Square, Bot, User, AlertTriangle, Loader2, Award, Star, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { englishSpeakingTutor, type EnglishSpeakingInput } from '@/ai/flows/english-speaking-flow';
import { useToast } from '@/hooks/use-toast';
import { applyRewards, calculateRewards } from '@/lib/rewards';
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from '@/lib/constants';
import { updateGameStats } from '@/lib/progress';
import CustomChatIcon from '../icons/custom-chat-icon';
import type { VoiceOption } from '@/app/speaking-practice/page';

const SpeechRecognition = (typeof window !== 'undefined') ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const speechSynthesis = (typeof window !== 'undefined') ? window.speechSynthesis : null;

interface SpeakingPracticeGameProps {
  sessionDuration: number;
  voice: VoiceOption;
  onBack: () => void;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const INITIAL_GREETING = "Hello! Let's practice our English. I'm ready when you are. Just press the microphone button to start talking.";

export default function SpeakingPracticeGame({ sessionDuration, voice, onBack }: SpeakingPracticeGameProps) {
    const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
    const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isAITurn, setIsAITurn] = useState(false);
    const [sttError, setSttError] = useState<string | null>(null);
    const [browserSupport, setBrowserSupport] = useState({ stt: false, tts: false });
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [currentResponse, setCurrentResponse] = useState(INITIAL_GREETING);
    const [currentCorrection, setCurrentCorrection] = useState<{ correction: string, explanation: string } | null>(null);

    const [timeLeft, setTimeLeft] = useState(sessionDuration * 60);
    const [totalUserWords, setTotalUserWords] = useState(0);
    const [correctedWords, setCorrectedWords] = useState(0);

    const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
    const { toast } = useToast();
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        setBrowserSupport({ stt: !!SpeechRecognition, tts: !!speechSynthesis });
        if (!SpeechRecognition) setSttError("Speech-to-text not supported by this browser.");
        if (!speechSynthesis) toast({ variant: 'destructive', title: "TTS Not Supported", description: "The AI's voice will not be available." });
    }, [toast]);
    
    // Timer Effect
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft <= 0 && gameState === 'playing') {
            setGameState('gameOver');
        }
    }, [timeLeft, gameState]);

    const speak = useCallback((text: string) => {
        if (!browserSupport.tts) {
            setIsAITurn(false);
            return;
        };
        
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = speechSynthesis.getVoices().find(v => v.name.includes(voice === 'female' ? 'Female' : 'Male') && v.lang.startsWith('en')) || null;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            setIsAITurn(false);
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            setIsAITurn(false);
        };
        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
    }, [browserSupport.tts, voice]);

    useEffect(() => {
        speak(INITIAL_GREETING);
    }, [speak]);

    const handleAIResponse = useCallback(async (userInput: string) => {
        setIsAITurn(true);
        setCurrentTranscript('');
        setCurrentCorrection(null);
        
        const historyForPrompt = conversationHistory.slice(-4);
        const input: EnglishSpeakingInput = { userInput, conversationHistory: historyForPrompt };

        try {
            const output = await englishSpeakingTutor(input);
            setConversationHistory(prev => [...prev, {role: 'user', content: userInput}, {role: 'assistant', content: output.aiResponse}]);
            setCurrentResponse(output.aiResponse);

            if (output.correction && output.explanation) {
                setCurrentCorrection({ correction: output.correction, explanation: output.explanation });
                setCorrectedWords(prev => prev + output.correction!.split(' ').length);
            }
            speak(output.aiResponse);
        } catch (error) {
            console.error("Error from AI flow:", error);
            const errorMsg = "Sorry, I had a little trouble thinking. Could you say that again?";
            setCurrentResponse(errorMsg);
            speak(errorMsg);
        }
    }, [conversationHistory, speak]);


    // Setup Speech Recognition
    useEffect(() => {
        if (!browserSupport.stt) return;
        
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsListening(true);
            setCurrentTranscript('');
            setCurrentCorrection(null);
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
        };

        recognition.onresult = (event) => {
            let interim_transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const finalTranscript = event.results[i][0].transcript.trim();
                    if(finalTranscript){
                        setTotalUserWords(prev => prev + finalTranscript.split(' ').length);
                        handleAIResponse(finalTranscript);
                    }
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            setCurrentTranscript(interim_transcript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setSttError(`Error: ${event.error}. Please check mic permissions.`);
            setIsListening(false);
        };
        
        recognition.onend = () => setIsListening(false);

        speechRecognitionRef.current = recognition;
    }, [browserSupport.stt, handleAIResponse]);
    
    const handleToggleListen = () => {
        if (isAITurn) return;
        
        if (isListening) {
            speechRecognitionRef.current?.stop();
        } else {
            setSttError(null);
            try {
                speechRecognitionRef.current?.start();
            } catch (e) {
                setSttError("Could not start microphone. It may already be in use.");
            }
        }
    };
    
    const accuracy = totalUserWords > 0 ? Math.max(0, (totalUserWords - correctedWords) / totalUserWords) * 100 : 100;
    
    let avatarState: 'idle' | 'listening' | 'speaking' = 'idle';
    if(isListening) avatarState = 'listening';
    if(isSpeaking) avatarState = 'speaking';

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            {gameState === 'gameOver' && (
                <GameOverDialog 
                    accuracy={accuracy} 
                    totalWords={totalUserWords}
                    sessionDuration={sessionDuration}
                    onPlayAgain={() => {
                        setConversationHistory([]);
                        setTimeLeft(sessionDuration * 60);
                        setTotalUserWords(0);
                        setCorrectedWords(0);
                        setGameState('playing');
                        setCurrentResponse(INITIAL_GREETING);
                        speak(INITIAL_GREETING);
                    }} 
                    onBack={onBack}
                />
            )}
            <Card className="w-full max-w-2xl shadow-xl flex flex-col h-[70vh]">
                 <CardHeader className="flex-shrink-0">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-3">
                            <Bot size={28} className="text-primary" />
                            <h1 className="text-2xl font-bold text-primary">Speaking Practice</h1>
                        </div>
                        <Button variant="outline" size="sm" onClick={onBack}>
                            <ArrowLeft size={16} className="mr-1" /> Back to Setup
                        </Button>
                    </div>
                     <Progress value={(timeLeft / (sessionDuration * 60)) * 100} className="w-full mt-2" />
                     <p className="text-center text-sm text-muted-foreground pt-1">
                        Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                     </p>
                </CardHeader>

                <div className="flex-grow flex flex-col items-center justify-center text-center p-4 space-y-4">
                     <div className="relative">
                        <CustomChatIcon size={128} className="transition-all duration-300"/>
                        {avatarState === 'listening' && (
                            <div className="absolute inset-0 rounded-full ring-4 ring-destructive ring-offset-4 ring-offset-background animate-pulse"></div>
                        )}
                         {avatarState === 'speaking' && (
                            <div className="absolute inset-0 rounded-full ring-4 ring-accent ring-offset-4 ring-offset-background animate-pulse"></div>
                        )}
                    </div>
                    
                    <div className="min-h-[6rem] flex flex-col items-center justify-center">
                        <p className="text-lg font-semibold text-foreground max-w-lg">{currentResponse}</p>
                    </div>
                    
                    <div className="min-h-[3rem] flex flex-col items-center justify-center">
                        <p className="text-md text-muted-foreground italic max-w-lg">{currentTranscript}</p>
                        {currentCorrection && (
                           <div className="mt-2 text-xs p-2 bg-yellow-100 border border-yellow-300 rounded-lg max-w-md">
                               <p><strong className="text-yellow-800">Correction:</strong> {currentCorrection.correction}</p>
                               <p className="mt-1"><strong className="text-yellow-800">Tip:</strong> {currentCorrection.explanation}</p>
                           </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 p-6 border-t text-center space-y-3">
                    {sttError && (
                        <div className="p-2 bg-destructive/10 text-destructive text-xs rounded-md flex items-center justify-center gap-2">
                            <AlertTriangle size={16} /> {sttError}
                        </div>
                    )}
                    <Button
                        onClick={handleToggleListen}
                        disabled={!browserSupport.stt || isAITurn}
                        size="lg"
                        className={cn("w-24 h-24 rounded-full text-lg shadow-lg", isListening ? "bg-destructive hover:bg-destructive/90" : "bg-accent hover:bg-accent/80")}
                    >
                        {isAITurn ? <Loader2 className="h-10 w-10 animate-spin"/> : <Mic className="h-10 w-10" />}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        {isAITurn ? "AI is replying..." : (isListening ? "Tap to stop" : "Tap to speak")}
                    </p>
                </div>
            </Card>
        </div>
    );
}


// Game Over Dialog Component
function GameOverDialog({ accuracy, totalWords, sessionDuration, onPlayAgain, onBack }: {
    accuracy: number;
    totalWords: number;
    sessionDuration: number;
    onPlayAgain: () => void;
    onBack: () => void;
}) {
    const [reward, setReward] = useState<{points: number, coins: number, stars: number} | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const calculateStars = useCallback((acc: number) => {
        if (acc >= 95) return 3;
        if (acc >= 80) return 2;
        if (acc > 0) return 1;
        return 0;
    }, []);

    useEffect(() => {
        const fetchReward = async () => {
            setIsLoading(true);
            try {
                const rewards = await calculateRewards({
                    gameId: 'speakingPractice',
                    difficulty: 'medium', // Base rewards on a medium difficulty
                    performanceMetrics: { accuracy, totalWords, sessionTime: sessionDuration }
                });
                const earned = applyRewards(rewards.sPoints, rewards.sCoins, "English Speaking Practice");
                const stars = calculateStars(accuracy);
                setReward({ points: earned.points, coins: earned.coins, stars });
                updateGameStats({ gameId: 'english-speaking', didWin: accuracy >= 80, score: accuracy });
            } catch (error) {
                console.error("Failed to calculate rewards for speaking practice:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReward();
    }, [accuracy, totalWords, sessionDuration, calculateStars]);

    const StarRating = ({ rating }: { rating: number }) => (
        <div className="flex justify-center">
            {[...Array(3)].map((_, i) => (
                <Star key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-center text-2xl flex items-center justify-center gap-2"><Award className="text-primary"/>Session Complete!</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-lg">You spoke <strong className="text-accent">{totalWords}</strong> words with <strong className="text-accent">{accuracy.toFixed(0)}%</strong> accuracy.</p>
                    {isLoading ? (
                        <div className="min-h-[100px] flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>
                    ) : reward ? (
                        <div className="space-y-3">
                            <StarRating rating={reward.stars} />
                             <div className="flex items-center justify-center gap-6 mt-2">
                                <span className="flex items-center font-bold text-2xl">
                                    +{reward.points} <SPointsIcon className="ml-2 h-7 w-7 text-yellow-400" />
                                </span>
                                <span className="flex items-center font-bold text-2xl">
                                    +{reward.coins} <SCoinsIcon className="ml-2 h-7 w-7 text-amber-500" />
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-red-500">Could not calculate rewards.</p>
                    )}
                </CardContent>
                <CardContent className="flex justify-center gap-4">
                    <Button onClick={onBack} variant="outline">Back to Menu</Button>
                    <Button onClick={onPlayAgain}>Play Again</Button>
                </CardContent>
            </Card>
        </div>
    )
}
