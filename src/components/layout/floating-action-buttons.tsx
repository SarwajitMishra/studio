"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Gift, Disc3, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
    label: string;
    Icon: React.ElementType;
    modalTitle: string;
    modalDescription: string;
}

const ActionButton = ({ label, Icon, modalTitle, modalDescription }: ActionButtonProps) => (
    <Dialog>
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-110"
                            aria-label={label}
                        >
                            <Icon className="h-6 w-6" />
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{modalTitle}</DialogTitle>
                <DialogDescription>{modalDescription}</DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
                <p className="text-muted-foreground">(Feature coming soon!)</p>
            </div>
        </DialogContent>
    </Dialog>
);

export default function FloatingActionButtons() {
    const [isDockOpen, setIsDockOpen] = useState(false);

    return (
        <div className="fixed bottom-6 left-6 flex flex-col items-center gap-3 z-50">
            {isDockOpen && (
                 <div className="flex flex-col gap-3 mb-2 p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-lg animate-in fade-in-50 slide-in-from-bottom-5">
                    <ActionButton
                        label="Daily Rewards"
                        Icon={Gift}
                        modalTitle="Daily Login Rewards"
                        modalDescription="Collect your daily reward for logging in!"
                    />
                    <ActionButton
                        label="Spin the Wheel"
                        Icon={Disc3}
                        modalTitle="Spin the Wheel"
                        modalDescription="Spin the wheel for a chance to win exciting prizes!"
                    />
                    <ActionButton
                        label="Live Events"
                        Icon={Calendar}
                        modalTitle="Live Events"
                        modalDescription="Check out the schedule for upcoming live events and tournaments."
                    />
                </div>
            )}
            
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button
                            variant="default"
                            size="icon"
                            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-110"
                            onClick={() => setIsDockOpen(!isDockOpen)}
                            aria-label="Toggle extra actions"
                        >
                            {isDockOpen ? <X className="h-7 w-7" /> : <span className="text-2xl font-bold">✨</span>}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                        <p>{isDockOpen ? "Close Actions" : "More Actions"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
