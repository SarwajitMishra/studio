
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CustomChatIcon from '../icons/custom-chat-icon';
import ShravyaChatModalContent from "@/components/ai/shravya-chat-modal-content";
import { useState } from "react";
import { cn } from '@/lib/utils';

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className={cn(
                  "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-accent hover:bg-accent/90 text-accent-foreground animate-gentle-bounce z-50",
                  "p-1", // Reduced padding to allow icon to fill more space
                  "transition-transform duration-200 ease-in-out hover:scale-110" // Added hover effect
                )}
                aria-label="Chat with Shravya AI"
              >
                <CustomChatIcon src="/icons/custom-chat-icon.png" alt="Shravya AI Chat" size={48} />
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
            <CustomChatIcon src="/icons/custom-chat-icon.png" alt="" size={28} className="mr-2" />
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
  );
}
