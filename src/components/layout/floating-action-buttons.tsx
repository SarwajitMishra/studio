"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X, Lightbulb, Mail, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function FloatingActionButtons() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 left-6 z-50">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="default"
                        size="icon"
                        className={cn(
                            "h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 transform",
                            isOpen ? "rotate-45" : "rotate-0"
                        )}
                        aria-label="Open support menu"
                    >
                        {isOpen ? <X size={28} /> : <Plus size={28} />}
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto p-2 space-y-2 mb-2 border-primary/50 bg-background/80 backdrop-blur-sm">
                    <Button asChild variant="ghost" className="w-full justify-start">
                        <Link href="#"><Lightbulb className="mr-2"/> Request New Feature</Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start">
                        <Link href="#"><Mail className="mr-2"/> Contact Us</Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start">
                        <Link href="#"><Heart className="mr-2"/> Donate / Support</Link>
                    </Button>
                </PopoverContent>
            </Popover>
        </div>
    )
}
