
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Square, Bot, User, Brain, AlertTriangle, Loader2, ArrowLeft, Award, Star, Ear } from 'lucide-react';
import { cn } from '@/lib/utils';
import { englishSpeakingTutor, type EnglishSpeakingInput, type EnglishSpeakingOutput } from '@/ai/flows/english-speaking-flow';
import { useToast } from '@/hooks/use-toast';
import { applyRewards, calculateRewards } from '@/lib/rewards';
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from '@/lib/constants';
import { updateGameStats } from '@/lib/progress';


const SpeechRecognition = (typeof window !== 'undefined') ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const speechSynthesis = (typeof window !== 'undefined') ? window.speechSynthesis : null;

interface SpeakingPracticeGameProps {
  sessionDuration: 1 | 3 | 5;
  voice: 'male' | 'female';
  onBack: () => void;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    correction?: string;
    explanation?: string;
}

const STREAMING_SPEED_MS = 30;

export default function SpeakingPracticeGame({ sessionDuration, voice, onBack }: SpeakingPracticeGameProps) {
    const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isAITurn, setIsAITurn] = useState(false);
    const [sttError, setSttError] = useState<string | null>(null);
    const [browserSupport, setBrowserSupport] = useState({ stt: false, tts: false });
    const [isSpeaking, setIsSpeaking] = useState(false);

    const [timeLeft, setTimeLeft] = useState(sessionDuration * 60);
    const [totalUserWords, setTotalUserWords] = useState(0);
    const [correctedWords, setCorrectedWords] = useState(0);

    const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
    const { toast } = useToast();
    const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            if (scrollAreaRef.current) {
                const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
                if (scrollViewport) {
                    scrollViewport.scrollTop = scrollViewport.scrollHeight;
                }
            }
        }, 100);
    }, []);

    useEffect(scrollToBottom, [conversation]);

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

    const handleAIResponse = useCallback(async (userInput: string) => {
        setIsAITurn(true);

        const historyForPrompt = conversation.slice(-6).map(({ role, content }) => ({ role, content }));
        const input: EnglishSpeakingInput = { userInput, conversationHistory: historyForPrompt };

        try {
            const output: EnglishSpeakingOutput = await englishSpeakingTutor(input);
            const aiMessageId = `assistant-${Date.now()}`;
            const fullResponse = output.aiResponse;

            setConversation(prev => [
                ...prev.map(msg => msg.id.startsWith('user-') ? { ...msg, correction: output.correction, explanation: output.explanation } : msg),
                { id: aiMessageId, role: 'assistant', content: '' }
            ]);

            if (output.correction) {
                setCorrectedWords(prev => prev + output.correction!.split(' ').length);
            }

            // Stream AI response
            const words = fullResponse.split(' ');
            let currentWordIndex = 0;
            const streamWords = () => {
                if (currentWordIndex < words.length) {
                    setConversation(prev => prev.map(msg =>
                        msg.id === aiMessageId ? { ...msg, content: words.slice(0, currentWordIndex + 1).join(' ') } : msg
                    ));
                    currentWordIndex++;
                    streamingTimeoutRef.current = setTimeout(streamWords, STREAMING_SPEED_MS);
                } else {
                    if(browserSupport.tts) {
                        const utterance = new SpeechSynthesisUtterance(fullResponse);
                        utterance.voice = speechSynthesis!.getVoices().find(v => v.name.includes(voice === 'female' ? 'Female' : 'Male') && v.lang.startsWith('en')) || null;
                        utterance.onstart = () => setIsSpeaking(true);
                        utterance.onend = () => { setIsSpeaking(false); setIsAITurn(false); };
                        speechSynthesis!.speak(utterance);
                    } else {
                        setIsAITurn(false);
                    }
                }
            };
            streamWords();

        } catch (error) {
            console.error("Error from AI flow:", error);
            toast({ variant: "destructive", title: "AI Error", description: "Could not get a response from Shravya AI." });
            setIsAITurn(false);
        }
    }, [conversation, voice, toast, browserSupport.tts]);


    // Setup Speech Recognition
    useEffect(() => {
        if (!browserSupport.stt) return;
        
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            if(transcript.trim()) {
                const newUserMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: transcript.trim() };
                setConversation(prev => [...prev, newUserMessage]);
                setTotalUserWords(prev => prev + transcript.trim().split(' ').length);
                handleAIResponse(transcript.trim());
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setSttError(`Error: ${event.error}. Please check microphone permissions.`);
            setIsListening(false);
        };
        
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        speechRecognitionRef.current = recognition;

        return () => {
            recognition.stop();
        }
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

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] max-w-2xl mx-auto">
            {gameState === 'gameOver' && (
                <GameOverDialog 
                    accuracy={accuracy} 
                    totalWords={totalUserWords}
                    sessionDuration={sessionDuration}
                    onPlayAgain={() => {
                        setConversation([]);
                        setTimeLeft(sessionDuration * 60);
                        setTotalUserWords(0);
                        setCorrectedWords(0);
                        setGameState('playing');
                    }} 
                    onBack={onBack}
                />
            )}
            <Card className="flex flex-col flex-grow w-full shadow-xl">
                <CardHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-3">
                            <Ear size={28} className="text-primary" />
                            <CardTitle className="text-2xl font-bold text-primary">English Speaking Practice</CardTitle>
                        </div>
                        <Button variant="outline" size="sm" onClick={onBack}>
                            <ArrowLeft size={16} className="mr-1" /> Back
                        </Button>
                    </div>
                    <Progress value={(timeLeft / (sessionDuration * 60)) * 100} className="w-full mt-2" />
                    <CardDescription className="text-center text-md text-foreground/80 pt-2">
                        Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-grow p-4 min-h-0">
                    <ScrollArea ref={scrollAreaRef} className="flex-grow pr-4 -mr-4">
                        <div className="space-y-4">
                            {conversation.map(msg => (
                                <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? 'items-end' : 'items-start')}>
                                    <div className={cn("flex items-start gap-3 w-full", msg.role === 'user' && 'flex-row-reverse')}>
                                        <div className={cn("p-2 rounded-full", msg.role === 'user' ? 'bg-secondary' : 'bg-accent')}>
                                            {msg.role === 'user' ? <User size={20}/> : <Bot size={20}/>}
                                        </div>
                                        <div className={cn("p-3 rounded-lg shadow max-w-[85%]", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border')}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                    {msg.correction && (
                                        <div className="mt-2 text-xs p-2 bg-yellow-100 border border-yellow-300 rounded-lg max-w-[85%] self-end">
                                            <p><strong className="text-yellow-800">Correction:</strong> {msg.correction}</p>
                                            {msg.explanation && <p className="mt-1"><strong className="text-yellow-800">Tip:</strong> {msg.explanation}</p>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="flex-shrink-0 pt-4 border-t text-center space-y-3">
                         {sttError && (
                            <div className="p-2 bg-destructive/10 text-destructive text-xs rounded-md flex items-center justify-center gap-2">
                                <AlertTriangle size={16} /> {sttError}
                            </div>
                         )}
                         <Button
                            onClick={handleToggleListen}
                            disabled={!browserSupport.stt || isAITurn || isSpeaking}
                            size="lg"
                            className={cn("w-full h-16 text-lg", isListening && "bg-destructive hover:bg-destructive/90")}
                         >
                            {isAITurn || isSpeaking ? <Loader2 className="mr-2 animate-spin"/> : (isListening ? <Square className="mr-2" /> : <Mic className="mr-2" />)}
                            {isAITurn ? "AI is replying..." : isSpeaking ? "AI is speaking..." : isListening ? "Stop Recording" : "Start Speaking"}
                         </Button>
                         <p className="text-xs text-muted-foreground">Click to start and stop recording. Shravya AI will reply automatically.</p>
                    </div>
                </CardContent>
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
