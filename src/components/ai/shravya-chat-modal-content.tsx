
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2, Sparkles, Mic, MicOff, AlertTriangle } from 'lucide-react';
import { shravyaAIChat, type ShravyaAIChatInput, type ShravyaAIChatOutput } from '@/ai/flows/shravya-ai-chat-flow';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SpeechRecognition = (typeof window !== 'undefined') ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const speechSynthesis = (typeof window !== 'undefined') ? window.speechSynthesis : null;

export default function ShravyaChatModalContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [isListening, setIsListening] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const [browserSupportsSTT, setBrowserSupportsSTT] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesReady, setVoicesReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadVoices = useCallback(() => {
    if (speechSynthesis) {
      const availableVoices = speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        setVoicesReady(true);
        console.log('[ShravyaAI TTS Client] Voices loaded:', availableVoices.length);
      } else {
        setTimeout(() => {
            const fallbackVoices = speechSynthesis.getVoices();
            if (fallbackVoices.length > 0) {
                setVoices(fallbackVoices);
                console.log('[ShravyaAI TTS Client] Voices loaded on fallback:', fallbackVoices.length);
            } else {
                 console.warn('[ShravyaAI TTS Client] No voices found even on fallback.');
            }
            setVoicesReady(true); 
        }, 200);
      }
    } else {
      setVoicesReady(true); 
    }
  }, []);

  useEffect(() => {
    if (speechSynthesis) {
      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    } else {
      setVoicesReady(true);
      console.warn("[ShravyaAI TTS Client] SpeechSynthesis API not supported by this browser.");
    }

    return () => {
      if (speechSynthesis) {
        speechSynthesis.onvoiceschanged = null;
        speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [loadVoices]);
  
  const speakText = useCallback((text: string, languageCode: string) => {
    if (!speechSynthesis || !voicesReady) {
      console.warn('[ShravyaAI TTS Client] Speech synthesis not ready or not supported, cannot speak:', `"${text.substring(0,30)}..."`);
      return;
    }
    speechSynthesis.cancel(); 

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCode;

    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (languageCode.toLowerCase().startsWith('hi')) {
      const hindiVoices = voices.filter(v => v.lang.toLowerCase().startsWith('hi-in'));
      selectedVoice = hindiVoices.find(v => v.name.toLowerCase().includes('female')) ||
                      hindiVoices.find(v => v.name.includes('Lekha')) ||
                      hindiVoices.find(v => v.name.includes('Kalpana')) ||
                      hindiVoices.find(v => v.name.includes('Google हिन्दी')) ||
                      hindiVoices[0];
      utterance.lang = selectedVoice?.lang || 'hi-IN';
    } else { 
      const indianEnglishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en-in'));
      selectedVoice = indianEnglishVoices.find(v => v.name.toLowerCase().includes('female')) ||
                      indianEnglishVoices[0];

      if (!selectedVoice) {
        const usEnglishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en-us'));
        selectedVoice = usEnglishVoices.find(v => v.name.toLowerCase().includes('female')) || usEnglishVoices[0];
      }
      utterance.lang = selectedVoice?.lang || 'en-US';
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`[ShravyaAI TTS Client] Attempting to use voice: ${selectedVoice.name} (${selectedVoice.lang}) for lang: ${languageCode}`);
    } else {
      console.warn(`[ShravyaAI TTS Client] No specific voice found for ${languageCode}. Using browser default for lang ${utterance.lang}.`);
    }

    utterance.onstart = () => console.log("[ShravyaAI TTS Client] Speech started for:", `"${text.substring(0, 30)}..."`);
    utterance.onend = () => console.log("[ShravyaAI TTS Client] Speech ended for:", `"${text.substring(0, 30)}..."`);
    utterance.onerror = (event) => {
      if (event.error === 'interrupted') {
        console.log("[ShravyaAI TTS Client] Speech interrupted for:", `"${text.substring(0,30)}..."`, "Utterance:", event.utterance);
      } else {
        console.error("[ShravyaAI TTS Client] Speech error:", event.error, "for text:", `"${text.substring(0,30)}..."`, "Utterance:", event.utterance);
        toast({
          variant: "destructive",
          title: "Speech Error",
          description: `Could not play Shravya AI's voice. Error: ${event.error}`,
        });
      }
    };
    speechSynthesis.speak(utterance);
  }, [voices, voicesReady, toast]);


  useEffect(() => {
    if (messages.length === 0 && voicesReady) {
      const initialMessageContent = "Hello! I'm Shravya AI. Ask me anything about the games in Shravya Playhouse! You can also click the microphone to speak.";
      setMessages([
        {
          id: 'initial-greeting',
          role: 'assistant',
          content: initialMessageContent,
        },
      ]);
      speakText(initialMessageContent, 'en-US');
    }
  }, [messages.length, voicesReady, speakText]);


  const handleSubmit = useCallback(async (e?: React.FormEvent<HTMLFormElement>, directInput?: string) => {
    if (e) e.preventDefault();
    const userInput = directInput || inputValue.trim();

    if (!userInput || isLoading) return;
    
    if (speechSynthesis) speechSynthesis.cancel();
    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setIsListening(false);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    if (!directInput) {
        setInputValue('');
    }
    setIsLoading(true);
    setSttError(null);

    try {
      const input: ShravyaAIChatInput = { userInput };
      const output: ShravyaAIChatOutput = await shravyaAIChat(input);
      
      const aiMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: output.response,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

      speakText(output.response, output.responseLanguage);

    } catch (error) {
      console.error('Error calling Shravya AI chat flow:', error);
      const errorText = "I'm sorry, something went wrong. Please try asking again later.";
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorText,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      speakText(errorText, 'en');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, isListening, speakText, toast]);

  useEffect(() => {
    if (SpeechRecognition) {
      setBrowserSupportsSTT(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false; 

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log("[ShravyaAI STT] Transcript:", transcript);
        // Automatically submit the transcript
        setInputValue(transcript); // Keep input field updated for consistency
        handleSubmit(undefined, transcript); 
        setSttError(null);
      };

      recognition.onerror = (event) => {
        console.error('[ShravyaAI STT] Speech recognition error', event.error);
        if (event.error === 'no-speech') {
          setSttError("I didn't hear anything. Please try again.");
        } else if (event.error === 'audio-capture') {
          setSttError("Couldn't access microphone. Please check permissions.");
        } else if (event.error === 'not-allowed') {
          setSttError("Microphone access denied. Please enable it in browser settings.");
        } else {
          setSttError(`Error: ${event.error}. Please try again.`);
        }
        setIsListening(false);
      };

      recognition.onstart = () => {
        setIsListening(true);
        setSttError(null);
        if (speechSynthesis) speechSynthesis.cancel(); 
        console.log("[ShravyaAI STT] Speech recognition started.");
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log("[ShravyaAI STT] Speech recognition ended.");
      };

      speechRecognitionRef.current = recognition;
    } else {
      setBrowserSupportsSTT(false);
      console.warn("[ShravyaAI STT] SpeechRecognition API not supported by this browser.");
    }

    return () => {
      if (speechRecognitionRef.current && isListening) {
        speechRecognitionRef.current.stop();
      }
      if (speechSynthesis) speechSynthesis.cancel();
    };
  }, [isListening, handleSubmit]);

  const handleToggleListen = () => {
    if (!browserSupportsSTT) {
      setSttError("Voice input is not supported by your browser.");
      toast({
        variant: "destructive",
        title: "Voice Input Not Supported",
        description: "Your browser does not support the Web Speech API for voice input.",
      });
      return;
    }

    if (speechRecognitionRef.current) {
      if (isListening) {
        speechRecognitionRef.current.stop();
      } else {
        if (speechSynthesis) speechSynthesis.cancel();
        setInputValue(''); 
        try {
           // Try setting language dynamically based on some heuristic or user setting (future enhancement)
           // For now, default to 'en-US' for STT, as LLM handles language detection on the backend.
          speechRecognitionRef.current.lang = 'en-US'; 
          speechRecognitionRef.current.start();
        } catch (e) {
          console.error("[ShravyaAI STT] Error starting speech recognition:", e);
           if ((e as DOMException).name === 'InvalidStateError') {
             setSttError("Voice recognition is busy. Please try again in a moment.");
           } else {
             setSttError("Could not start voice input. Please try again.");
           }
          setIsListening(false);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-[70vh] sm:h-[60vh]">
      {sttError && (
        <div className="mb-2 p-2 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-xs flex items-center">
          <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
          {sttError}
        </div>
      )}
      {!browserSupportsSTT && (
         <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-yellow-700 text-xs flex items-center">
          <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
          Voice input (microphone) is not supported by your browser. You can still type your questions.
        </div>
      )}
      {!voicesReady && speechSynthesis && (
        <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-md text-blue-700 text-xs flex items-center">
            <Loader2 size={16} className="animate-spin mr-2"/> Initializing voices...
        </div>
      )}


      <ScrollArea className="flex-grow mb-4 pr-4 -mr-4" ref={scrollAreaRef}>
        <div className="space-y-4 py-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-start space-x-3',
                message.role === 'user' ? 'justify-end' : ''
              )}
            >
              {message.role === 'assistant' && (
                <span className="flex-shrink-0 p-2 bg-accent rounded-full text-accent-foreground shadow">
                  <Bot size={20} />
                </span>
              )}
              <div
                className={cn(
                  'p-3 rounded-lg shadow max-w-[85%] sm:max-w-[75%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                 <span className="flex-shrink-0 p-2 bg-secondary rounded-full text-secondary-foreground shadow">
                  <User size={20} />
                </span>
              )}
            </div>
          ))}
          {isLoading && !isListening && (
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 p-2 bg-accent rounded-full text-accent-foreground shadow">
                 <Bot size={20} />
              </span>
              <div className="p-3 rounded-lg shadow bg-card border flex items-center space-x-2">
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Shravya AI is thinking...</span>
              </div>
            </div>
          )}
           {isListening && (
            <div className="flex items-start space-x-3 text-muted-foreground">
               <span className="flex-shrink-0 p-2 bg-destructive/70 rounded-full text-white shadow animate-pulse">
                  <Mic size={20} />
                </span>
              <div className="p-3 rounded-lg shadow bg-card border flex items-center space-x-2">
                <span className="text-sm">Listening...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={(e) => { handleSubmit(e); }} className="flex items-center space-x-2 border-t pt-4">
        <Input
          type="text"
          placeholder={isListening ? "Listening..." : "Ask Shravya AI..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-grow text-base"
          disabled={isLoading || isListening}
          aria-label="Your message to Shravya AI"
        />
        {browserSupportsSTT && (
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={handleToggleListen}
            disabled={isLoading}
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !inputValue.trim() || isListening} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {isLoading && !isListening ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </form>
       <p className="text-xs text-muted-foreground text-center mt-3">
          <Sparkles size={12} className="inline mr-1"/>
          Shravya AI's voice quality depends on your browser and may not always be available. Responses & translations may be inaccurate.
      </p>
    </div>
  );
}

