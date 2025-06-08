
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2, Sparkles } from 'lucide-react';
import { shravyaAIChat, type ShravyaAIChatInput, type ShravyaAIChatOutput } from '@/ai/flows/shravya-ai-chat-flow';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";


interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ShravyaAIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
    // Initial greeting from Shravya AI
    setMessages([
      {
        id: 'initial-greeting',
        role: 'assistant',
        content: "Hello! I'm Shravya AI. Ask me anything about the games in Shravya Playhouse!",
      },
    ]);
  }, []);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const userInput = inputValue.trim();
    if (!userInput || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const input: ShravyaAIChatInput = { userInput };
      const output: ShravyaAIChatOutput = await shravyaAIChat(input);

      const aiMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: output.response,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error calling Shravya AI chat flow:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, something went wrong. Please try asking again later.",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: "Could not get a response from Shravya AI.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <title>Chat with Shravya AI | Shravya Playhouse</title>
      <meta name="description" content="Ask Shravya AI questions about the games available in Shravya Playhouse." />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="bg-primary/10">
            <div className="flex items-center space-x-3">
              <Bot size={32} className="text-primary" />
              <CardTitle className="text-3xl font-bold text-primary">Chat with Shravya AI</CardTitle>
            </div>
            <CardDescription className="text-lg text-foreground/80 pt-2">
              Ask me about the games in Shravya Playhouse! For example: "Tell me about Chess" or "What puzzle games are there?"
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 flex flex-col h-[60vh]">
            <ScrollArea className="flex-grow mb-4 pr-4 -mr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
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
                        'p-3 rounded-lg shadow max-w-[75%]',
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
                {isLoading && (
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
              </div>
            </ScrollArea>
            <form onSubmit={handleSubmit} className="flex items-center space-x-2 border-t pt-4">
              <Input
                type="text"
                placeholder="Ask Shravya AI..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-grow text-base"
                disabled={isLoading}
                aria-label="Your message to Shravya AI"
              />
              <Button type="submit" disabled={isLoading || !inputValue.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90">
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
                Shravya AI may occasionally provide inaccurate information.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
