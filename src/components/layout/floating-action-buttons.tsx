"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, X, Lightbulb, Mail, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function FloatingActionButtons() {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { href: '#', label: 'Request New Feature', Icon: Lightbulb },
        { href: '#', label: 'Contact Us', Icon: Mail },
        { href: '#', label: 'Donate / Support', Icon: Heart },
    ];

    return (
        <TooltipProvider>
            <div 
                className="fixed bottom-6 left-6 z-50 flex flex-col-reverse items-center gap-3"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                {/* Main trigger button */}
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="default"
                            size="icon"
                            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 transform"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-expanded={isOpen}
                            aria-label={isOpen ? "Close support menu" : "Open support menu"}
                        >
                           <Zap className={cn("absolute transition-all duration-300", isOpen ? "rotate-45 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} size={28} />
                           <X className={cn("absolute transition-all duration-300", isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-45 scale-0 opacity-0")} size={28} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                        <p>{isOpen ? "Close" : "Support & Feedback"}</p>
                    </TooltipContent>
                </Tooltip>
                
                {/* Secondary action buttons */}
                <div 
                    className={cn(
                        "flex flex-col items-center gap-3 transition-all duration-300 ease-in-out",
                        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                    )}
                >
                    {menuItems.map((item, index) => (
                         <Tooltip key={item.label}>
                            <TooltipTrigger asChild>
                                <Button asChild variant="secondary" size="icon" className="h-12 w-12 rounded-full shadow-lg">
                                    <Link href={item.href}><item.Icon size={24} /></Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="ml-2">
                                <p>{item.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </div>
        </TooltipProvider>
    );
}
