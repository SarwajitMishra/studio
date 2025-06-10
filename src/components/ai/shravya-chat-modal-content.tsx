
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2, Sparkles, Mic, MicOff, Volume2, AlertTriangle } from 'lucide-react';
import { shravyaAIChat, type ShravyaAIChatInput, type ShravyaAIChatOutput } from '@/ai/flows/shravya-ai-chat-flow';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Browser compatibility check
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
    if (messages.length === 0) {
      const initialMessage = "Hello! I'm Shravya AI. Ask me anything about the games in Shravya Playhouse! You can also click the microphone to speak.";
      setMessages([
        {
          id: 'initial-greeting',
          role: 'assistant',
          content: initialMessage,
        },
      ]);
      speakText(initialMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (SpeechRecognition) {
      setBrowserSupportsSTT(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
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

    // Cleanup: stop recognition and synthesis if component unmounts
    return () => {
      if (speechRecognitionRef.current && isListening) {
        speechRecognitionRef.current.stop();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]); // Re-run if isListening changes from an external source, though unlikely here

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Cancel any ongoing speech before starting new one
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      // You can add more configurations like voice, rate, pitch here
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const userInput = inputValue.trim();
    if (!userInput || isLoading) return;

    // Stop any ongoing speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }


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
      speakText(output.response);
    } catch (error) {
      console.error('Error calling Shravya AI chat flow:', error);
      const errorText = "I'm sorry, something went wrong. Please try asking again later.";
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorText,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      speakText(errorText);
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: "Could not get a response from Shravya AI.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        // Cancel any ongoing speech synthesis before listening
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
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
          {isLoading && !isListening && ( // Show typing indicator only if not listening
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
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 border-t pt-4">
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
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </form>
       <p className="text-xs text-muted-foreground text-center mt-3">
          <Sparkles size={12} className="inline mr-1"/>
          Shravya AI may occasionally provide inaccurate information. Voice features work best in Chrome/Edge.
      </p>
    </div>
  );
}
