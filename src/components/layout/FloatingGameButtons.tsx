"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Gift, Orbit, Calendar, Ticket } from 'lucide-react';
import Link from 'next/link';

const FloatingSideButton = ({ side, href, tooltip, Icon, isLink = false, children }: {
    side: 'left' | 'right';
    href: string;
    tooltip: string;
    Icon: React.ElementType;
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
                           <Link href={href}><Icon size={32} /></Link>
                        </Button>
                    ) : (
                        <DialogTrigger asChild>
                           <Button {...commonButtonProps}><Icon size={32} /></Button>
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
                <FloatingSideButton side="left" href="#" tooltip="Daily Rewards" Icon={Gift}>
                    <Gift size={64} className="mx-auto text-primary/30" />
                    <p className="mt-4">Claim your daily rewards right here!</p>
                </FloatingSideButton>
                <FloatingSideButton side="left" href="#" tooltip="Spin the Wheel" Icon={Orbit}>
                     <Orbit size={64} className="mx-auto text-primary/30" />
                     <p className="mt-4">Spin the wheel for a chance to win exciting prizes!</p>
                </FloatingSideButton>
            </div>

            {/* Right side buttons */}
            <div className="fixed top-1/3 right-6 z-40 flex flex-col items-center space-y-4">
                <FloatingSideButton side="right" href="#" tooltip="Live Events" Icon={Calendar}>
                     <Calendar size={64} className="mx-auto text-primary/30" />
                     <p className="mt-4">Join special events, tournaments, and seasonal celebrations.</p>
                </FloatingSideButton>
                <FloatingSideButton side="right" href="/contest" tooltip="Monthly Contest" Icon={Ticket} isLink>
                    {/* Content is not needed for a link button */}
                    <div />
                </FloatingSideButton>
            </div>
        </>
    );
}
