
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Bot, MessageCircle } from "lucide-react";
import ShravyaChatModalContent from "@/components/ai/shravya-chat-modal-content";
import { useState } from "react";

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default" // Changed to default for better visibility
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-accent hover:bg-accent/90 text-accent-foreground animate-gentle-bounce z-50"
          aria-label="Open Shravya AI Chat"
        >
          <MessageCircle size={28} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl md:max-w-2xl p-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 sm:p-6 border-b bg-primary/10">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-primary flex items-center">
            <Bot size={28} className="mr-2" /> Chat with Shravya AI
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
