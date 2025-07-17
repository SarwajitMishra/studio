
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ShravyaChatModalContent from "@/components/ai/shravya-chat-modal-content";
import CustomChatIcon from '../icons/custom-chat-icon';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
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
                    "transition-transform duration-200 ease-in-out hover:scale-110"
                  )}
                  aria-label="Chat with Shravya AI"
                >
                  <CustomChatIcon size={56} />
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
              <CustomChatIcon size={24} className="mr-3" />
              Chat with Shravya AI
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-foreground/80">
              Ask about games in Shravya Playlab!
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 sm:p-6 overflow-hidden flex-grow">
            <ShravyaChatModalContent />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
