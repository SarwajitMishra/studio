
"use client";

import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from 'next/link';

const FloatingSideButton = ({ side, href, tooltip, iconSrc, hint, isLink = false, children }: {
    side: 'left' | 'right';
    href: string;
    tooltip: string;
    iconSrc: string;
    hint: string;
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
                           <Link href={href}><div><Image src={iconSrc} alt={tooltip} width={32} height={32} data-ai-hint={hint} /></div></Link>
                        </Button>
                    ) : (
                        <DialogTrigger asChild>
                           <Button {...commonButtonProps}>
                                <div><Image src={iconSrc} alt={tooltip} width={32} height={32} data-ai-hint={hint} /></div>
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
    return (
        <>
            {/* Left side buttons */}
            <div className="fixed top-1/3 left-6 z-40 flex flex-col items-center space-y-4">
                <FloatingSideButton side="left" href="#" tooltip="Daily Rewards" iconSrc="/images/icons/gift.png" hint="gift box" >
                    <Image src="/images/icons/gift.png" alt="Gift Icon" width={64} height={64} className="mx-auto opacity-30" data-ai-hint="gift box" />
                    <p className="mt-4">Claim your daily rewards right here!</p>
                </FloatingSideButton>
                <FloatingSideButton side="left" href="#" tooltip="Spin the Wheel" iconSrc="/images/icons/orbit.png" hint="spin wheel" >
                     <Image src="/images/icons/orbit.png" alt="Orbit Icon" width={64} height={64} className="mx-auto opacity-30" data-ai-hint="spin wheel" />
                     <p className="mt-4">Spin the wheel for a chance to win exciting prizes!</p>
                </FloatingSideButton>
            </div>

            {/* Right side buttons */}
            <div className="fixed top-1/3 right-6 z-40 flex flex-col items-center space-y-4">
                <FloatingSideButton side="right" href="#" tooltip="Live Events" iconSrc="/images/icons/calendar.png" hint="event calendar" >
                     <Image src="/images/icons/calendar.png" alt="Calendar Icon" width={64} height={64} className="mx-auto opacity-30" data-ai-hint="event calendar" />
                     <p className="mt-4">Join special events, tournaments, and seasonal celebrations.</p>
                </FloatingSideButton>
                <FloatingSideButton side="right" href="/contest" tooltip="Monthly Contest" iconSrc="/images/icons/ticket.png" hint="contest ticket" isLink>
                    {/* Content is not needed for a link button */}
                    <div />
                </FloatingSideButton>
            </div>
        </>
    );
}
