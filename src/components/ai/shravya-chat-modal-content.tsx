
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
  
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesReady, setVoicesReady] = useState(false);
  const initialMessageSpokenRef = useRef(false);


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

  useEffect(() => {
    let mounted = true;
    const updateVoices = () => {
      if (!mounted || typeof window === 'undefined' || !window.speechSynthesis) return;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        if(mounted) setVoicesReady(true);
        console.log("[ShravyaAI TTS] Voices loaded:", voices.length);
      } else {
         if(mounted && !voicesReady) {
            setVoicesReady(true); 
            console.log("[ShravyaAI TTS] Voices API responded, but no voices initially found.");
         }
      }
    };
  
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const initialVoices = window.speechSynthesis.getVoices();
      if (initialVoices.length > 0) {
        setAvailableVoices(initialVoices);
        setVoicesReady(true);
        console.log("[ShravyaAI TTS] Initial voices found:", initialVoices.length);
      }
  
      window.speechSynthesis.onvoiceschanged = updateVoices;
      
      const fallbackTimer = setTimeout(() => {
          if(mounted && !voicesReady) {
              console.log("[ShravyaAI TTS] Fallback: trying to get voices again.");
              const currentVoices = window.speechSynthesis.getVoices();
              if (currentVoices.length > 0) {
                  setAvailableVoices(currentVoices);
                  console.log("[ShravyaAI TTS] Fallback: voices found:", currentVoices.length);
              } else {
                  console.log("[ShravyaAI TTS] Fallback: still no voices found.");
              }
              setVoicesReady(true); 
          }
      }, 500); 
  
      return () => {
        mounted = false;
        clearTimeout(fallbackTimer);
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    } else {
      if(mounted) {
        setVoicesReady(true); 
        console.warn("[ShravyaAI TTS] SpeechSynthesis API not available. Voices not loaded.");
      }
    }
  }, [voicesReady]);

  const speakText = useCallback((text: string, languageCode: string = 'en') => {
    if (typeof window !== 'undefined' && window.speechSynthesis && text && voicesReady) {
      console.log("[ShravyaAI TTS] Attempting to speak:", `"${text.substring(0,30)}..."`, "Language:", languageCode, "Voices available:", availableVoices.length);
      
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      
      let targetLang = languageCode.toLowerCase();
      let selectedVoice: SpeechSynthesisVoice | null = null;

      if (targetLang.startsWith('hi')) {
        const specificHindiFemaleNames = ['lekha', 'kalpana', 'google हिन्दी'];
        const priorityHindiVoices = availableVoices.filter(
          (voice) => voice.lang.toLowerCase().startsWith('hi-in') && 
                      (specificHindiFemaleNames.some(name => voice.name.toLowerCase().includes(name)) ||
                       voice.name.toLowerCase().includes('female'))
        );

        if (priorityHindiVoices.length > 0) {
          selectedVoice = priorityHindiVoices[0]; // Preferring known female names or 'female' in name
          console.log("[ShravyaAI TTS] Selected Priority Hindi Female Voice:", selectedVoice.name, selectedVoice.lang);
        } else {
          const anyHindiVoice = availableVoices.find(voice => voice.lang.toLowerCase().startsWith('hi-in'));
          if (anyHindiVoice) {
            selectedVoice = anyHindiVoice;
            console.log("[ShravyaAI TTS] Selected Fallback Hindi Voice:", selectedVoice.name, selectedVoice.lang);
          }
        }
        utterance.lang = 'hi-IN';
      } else { 
        const indianEnglishFemaleVoices = availableVoices.filter(
          (voice) => voice.lang.toLowerCase().startsWith('en-in') && voice.name.toLowerCase().includes('female')
        );
        if (indianEnglishFemaleVoices.length > 0) {
          selectedVoice = indianEnglishFemaleVoices[0];
           console.log("[ShravyaAI TTS] Selected Indian English Female Voice:", selectedVoice.name, selectedVoice.lang);
        } else {
          const anyIndianEnglishVoice = availableVoices.find(voice => voice.lang.toLowerCase().startsWith('en-in'));
          if (anyIndianEnglishVoice) {
            selectedVoice = anyIndianEnglishVoice;
            console.log("[ShravyaAI TTS] Selected Fallback Indian English Voice:", selectedVoice.name, selectedVoice.lang);
          } else {
            const usEnglishFemaleVoices = availableVoices.filter(
                (voice) => voice.lang.toLowerCase().startsWith('en-us') && voice.name.toLowerCase().includes('female')
            );
            if (usEnglishFemaleVoices.length > 0) {
                selectedVoice = usEnglishFemaleVoices[0];
                console.log("[ShravyaAI TTS] Selected Fallback US English Female Voice:", selectedVoice.name, selectedVoice.lang);
            }
          }
        }
        utterance.lang = selectedVoice?.lang || 'en-US'; 
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else {
        console.warn(`[ShravyaAI TTS] No specific voice found for lang ${languageCode}. Using browser default for ${utterance.lang}.`);
      }
      console.log("[ShravyaAI TTS] Utterance final lang:", utterance.lang, "Selected voice name:", utterance.voice?.name);

      utterance.onstart = () => console.log("[ShravyaAI TTS] Speech started for:", `"${text.substring(0, 30)}..."`);
      utterance.onend = () => console.log("[ShravyaAI TTS] Speech ended for:", `"${text.substring(0, 30)}..."`);
      utterance.onerror = (event) => {
        console.error("[ShravyaAI TTS] Speech error:", event.error, "for text:", `"${text.substring(0,30)}..."`, "Utterance:", event.utterance);
        if (event.error !== 'interrupted') {
          toast({
            variant: "destructive",
            title: "Speech Error",
            description: `Could not play audio: ${event.error}`,
          });
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
        console.log("[ShravyaAI TTS] Called speechSynthesis.speak() for:", `"${text.substring(0,30)}..."`);
      } catch (e) {
        console.error("[ShravyaAI TTS] Exception calling speechSynthesis.speak():", e);
         toast({
          variant: "destructive",
          title: "Speech Synthesis Error",
          description: "An unexpected error occurred while trying to play audio.",
        });
      }

    } else {
      if (!voicesReady) console.warn("[ShravyaAI TTS] SpeakText: Voices not ready yet.");
      if (!text) console.warn("[ShravyaAI TTS] SpeakText: Called with empty text.");
      if (typeof window === 'undefined' || !window.speechSynthesis) console.warn("[ShravyaAI TTS] SpeakText: SpeechSynthesis API not available.");
    }
  }, [availableVoices, toast, voicesReady]);

  useEffect(() => {
    if (messages.length === 0 && !initialMessageSpokenRef.current) {
      const initialMessage = "Hello! I'm Shravya AI. Ask me anything about the games in Shravya Playhouse! You can also click the microphone to speak.";
      setMessages([
        {
          id: 'initial-greeting',
          role: 'assistant',
          content: initialMessage,
        },
      ]);
    }
  }, [messages.length]); 

  useEffect(() => {
    if (voicesReady && messages.length === 1 && messages[0].id === 'initial-greeting' && !initialMessageSpokenRef.current) {
      console.log("[ShravyaAI TTS] Attempting to speak initial greeting as voices are ready.");
      speakText(messages[0].content, 'en');
      initialMessageSpokenRef.current = true;
    }
  }, [voicesReady, messages, speakText]);


  const handleSubmit = useCallback(async (e?: React.FormEvent<HTMLFormElement>, directInput?: string) => {
    if (e) e.preventDefault();
    const userInput = directInput || inputValue.trim();

    if (!userInput || isLoading) return;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
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
      if (output.response) { 
        speakText(output.response, output.responseLanguage);
      }
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
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: "Could not get a response from Shravya AI.",
      });
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
        setInputValue(transcript); 
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
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel(); 
      }
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
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel(); 
        }
        setInputValue(''); 
        try {
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
                <span className="text-sm text-muted-foreground">Shravya AI is typing...</span>
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
      <form onSubmit={(e) => handleSubmit(e)} className="flex items-center space-x-2 border-t pt-4">
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
          Shravya AI will try to use an Indian English or Hindi voice. Availability depends on your browser/OS. Responses (including translations) may sometimes be inaccurate.
      </p>
    </div>
  );
}
    
