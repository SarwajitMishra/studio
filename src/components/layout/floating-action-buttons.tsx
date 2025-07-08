
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function FloatingActionButtons() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const menuItems = [
        { href: '#', label: 'Request New Feature', iconSrc: '/images/icons/lightbulb.png', hint: 'idea lightbulb' },
        { href: '#', label: 'Contact Us', iconSrc: '/images/icons/mail.png', hint: 'envelope mail' },
        { href: '#', label: 'Donate / Support', iconSrc: '/images/icons/heart.png', hint: 'support heart' },
    ];

    if (!isMounted) {
        return null;
    }

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
                            <div>
                                <Image src="/images/icons/zap.png" alt="Open Menu" width={28} height={28} data-ai-hint="action menu" className={cn("absolute transition-all duration-300", isOpen ? "rotate-45 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
                                <Image src="/images/icons/close.png" alt="Close Menu" width={28} height={28} data-ai-hint="close" className={cn("absolute transition-all duration-300", isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-45 scale-0 opacity-0")} />
                            </div>
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
                                    <Link href={item.href}>
                                        <div><Image src={item.iconSrc} alt={item.label} width={24} height={24} data-ai-hint={item.hint} /></div>
                                    </Link>
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
