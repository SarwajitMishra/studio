
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
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      loadVoices(); 
      window.speechSynthesis.onvoiceschanged = loadVoices; 
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const speakText = useCallback((text: string, languageCode: string = 'en') => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      
      const targetLang = languageCode.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
      utterance.lang = targetLang;

      let selectedVoice: SpeechSynthesisVoice | null = null;

      if (availableVoices.length > 0) {
        const langVoices = availableVoices.filter(voice => voice.lang === targetLang);

        if (langVoices.length > 0) {
          if (targetLang === 'hi-IN') {
            // Prioritize specific known female Hindi voices
            let specificFemaleVoice = langVoices.find(v => 
              v.name.toLowerCase().includes('lekha') || 
              v.name.toLowerCase().includes('kalpana')
            );
            if (specificFemaleVoice) {
                selectedVoice = specificFemaleVoice;
            } else {
                // Then try generic "female" in name
                let genericFemaleVoice = langVoices.find(v => v.name.toLowerCase().includes('female'));
                if (genericFemaleVoice) {
                    selectedVoice = genericFemaleVoice;
                } else {
                    // Then try "Google हिन्दी" as it's often female and good quality
                    let googleHindiVoice = langVoices.find(v => v.name.toLowerCase().includes('google हिन्दी'));
                    if (googleHindiVoice) {
                        selectedVoice = googleHindiVoice;
                    } else {
                        // Fallback to the first available Hindi voice
                        selectedVoice = langVoices[0];
                    }
                }
            }
          } else { // English voice selection (en-IN preference)
            const indianFemaleVoices = langVoices.filter(
              (voice) => voice.lang === 'en-IN' && (
                voice.name.toLowerCase().includes('female') ||
                voice.name.toLowerCase().includes('aditi') ||
                voice.name.toLowerCase().includes('raveena')
              )
            );
            selectedVoice = indianFemaleVoices.length > 0 ? indianFemaleVoices[0] : langVoices.length > 0 ? langVoices[0] : null;
          }
        }
        
        // Fallback for English if no en-IN or targetLang voice found
        if (!selectedVoice && targetLang.startsWith('en')) {
          const usFemaleVoices = availableVoices.filter(
            voice => voice.lang === 'en-US' && voice.name.toLowerCase().includes('female')
          );
          if (usFemaleVoices.length > 0) {
            selectedVoice = usFemaleVoices[0];
          } else { 
             const anyEnglishVoice = availableVoices.find(voice => voice.lang.startsWith('en-'));
             if(anyEnglishVoice) selectedVoice = anyEnglishVoice;
          }
        }
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      // If no voice is selected, the browser will use its default for the utterance.lang.
      window.speechSynthesis.speak(utterance);
    }
  }, [availableVoices]);


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
    if (messages.length === 1 && messages[0].id === 'initial-greeting' && !initialMessageSpokenRef.current) {
      const timer = setTimeout(() => {
        speakText(messages[0].content, 'en');
        initialMessageSpokenRef.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, speakText]);


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
    setInputValue(''); 
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
      recognition.lang = 'en-US'; 

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleSubmit(undefined, transcript); 
        setIsListening(false); 
        setSttError(null);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
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
      };

      recognition.onend = () => {
        setIsListening(false); 
      };

      speechRecognitionRef.current = recognition;
    } else {
      setBrowserSupportsSTT(false);
      console.warn("SpeechRecognition API not supported by this browser.");
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
        setIsListening(false); 
      } else {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel(); 
        }
        setInputValue(''); 
        speechRecognitionRef.current.start();
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

