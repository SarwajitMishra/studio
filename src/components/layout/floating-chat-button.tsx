
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CustomChatIcon from '../icons/custom-chat-icon';
import ShravyaChatModalContent from "@/components/ai/shravya-chat-modal-content";
import { useState, useEffect } from "react";
import { cn } from '@/lib/utils';

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
      setIsMounted(true);
  }, []);

  if (!isMounted) {
      return null;
  }

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-center z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className={cn(
                    "h-14 w-14 rounded-full shadow-lg bg-accent hover:bg-accent/90 text-accent-foreground animate-gentle-bounce",
                    "p-1", 
                    "transition-transform duration-200 ease-in-out hover:scale-110"
                  )}
                  aria-label="Chat with Shravya AI"
                >
                  <div>
                    <CustomChatIcon src="/images/custom-chat-icon.png" alt="Shravya AI Chat" size={48} />
                  </div>
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="left" className="mr-2 mb-1">
              <p>Chat with Shravya AI</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent className="sm:max-w-xl md:max-w-2xl p-0 max-h-[85vh] flex flex-col">
          <DialogHeader className="p-4 sm:p-6 border-b bg-primary/10">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-primary flex items-center">
              <CustomChatIcon src="/images/custom-chat-icon.png" alt="" size={28} className="mr-2" />
              Chat with Shravya AI
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-foreground/80">
              Ask about games in Shravya Playhouse!
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 sm:p-6 overflow-hidden flex-grow">
            <ShravyaChatModalContent />
          </div>
        </DialogContent>
      </Dialog>
      <p className="text-xs text-center text-muted-foreground mt-1.5 px-2 py-0.5 bg-background/70 rounded-md shadow-sm">
        Ask Shravya about the games!
      </p>
    </div>
  );
}
