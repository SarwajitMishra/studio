
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faGear, faCalendarDays, faTicket } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

const FloatingSideButton = ({ side, href, tooltip, icon, isLink = false, children }: {
    side: 'left' | 'right';
    href: string;
    tooltip: string;
    icon: IconDefinition;
    isLink?: boolean;
    children: React.ReactNode;
}) => {
    const commonButtonProps = {
        variant: "default",
        size: "icon",
        className: "h-16 w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-transform duration-200 ease-in-out hover:scale-110"
    } as const;

    const ButtonContent = () => (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {isLink ? (
                        <Button {...commonButtonProps} asChild>
                           <Link href={href}><FontAwesomeIcon icon={icon} size="2x" /></Link>
                        </Button>
                    ) : (
                        <DialogTrigger asChild>
                           <Button {...commonButtonProps}>
                                <FontAwesomeIcon icon={icon} size="2x" />
                           </Button>
                        </DialogTrigger>
                    )}
                </TooltipTrigger>
                <TooltipContent side={side === 'left' ? 'right' : 'left'} className="mx-2">
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    if (isLink) {
        return <ButtonContent />;
    }

    return (
        <Dialog>
            <ButtonContent />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{tooltip}</DialogTitle>
                    <DialogDescription>
                        This feature is coming soon! Check back later for updates.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 text-center">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function FloatingGameButtons() {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    if (!isMounted) return null;

    return (
        <>
            {/* Left side buttons */}
            <div className="fixed top-1/3 left-6 z-40 flex flex-col items-center space-y-4">
                <FloatingSideButton side="left" href="#" tooltip="Daily Rewards" icon={faGift}>
                    <FontAwesomeIcon icon={faGift} size="4x" className="mx-auto opacity-30" />
                    <p className="mt-4">Claim your daily rewards right here!</p>
                </FloatingSideButton>
                <FloatingSideButton side="left" href="#" tooltip="Spin the Wheel" icon={faGear}>
                     <FontAwesomeIcon icon={faGear} size="4x" className="mx-auto opacity-30" />
                     <p className="mt-4">Spin the wheel for a chance to win exciting prizes!</p>
                </FloatingSideButton>
            </div>

            {/* Right side buttons */}
            <div className="fixed top-1/3 right-6 z-40 flex flex-col items-center space-y-4">
                <FloatingSideButton side="right" href="#" tooltip="Live Events" icon={faCalendarDays}>
                     <FontAwesomeIcon icon={faCalendarDays} size="4x" className="mx-auto opacity-30" />
                     <p className="mt-4">Join special events, tournaments, and seasonal celebrations.</p>
                </FloatingSideButton>
                <FloatingSideButton side="right" href="/contest" tooltip="Monthly Contest" icon={faTicket} isLink>
                    {/* Content is not needed for a link button */}
                    <div />
                </FloatingSideButton>
            </div>
        </>
    );
}
