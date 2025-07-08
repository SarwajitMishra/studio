
import type { ReactNode } from 'react';
import Header from './header';
import FloatingChatButton from './floating-chat-button';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Gift, Disc3, Calendar, Ticket } from 'lucide-react';
import Link from 'next/link';


interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-primary/10 text-center py-4 text-sm text-foreground/70">
        <p>&copy; {new Date().getFullYear()} Shravya Playhouse. All rights reserved.</p>
      </footer>
      
      {/* --- Floating Action Buttons --- */}

      {/* Daily Rewards (Left) */}
      <Dialog>
        <div className="fixed top-1/3 left-6 z-40">
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-16 w-16 rounded-full shadow-lg transition-transform hover:scale-110 bg-background/80 backdrop-blur-sm border-2 border-primary/20">
                                <Gift className="h-8 w-8 text-primary" />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                        <p>Daily Rewards</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Daily Login Rewards</DialogTitle>
                <DialogDescription>Collect your daily reward for logging in!</DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
                <p className="text-muted-foreground">(Feature coming soon!)</p>
            </div>
        </DialogContent>
      </Dialog>

      {/* Spin the Wheel (Left) */}
       <Dialog>
        <div className="fixed top-1/2 left-6 z-40">
            <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-16 w-16 rounded-full shadow-lg transition-transform hover:scale-110 bg-background/80 backdrop-blur-sm border-2 border-primary/20">
                            <Disc3 className="h-8 w-8 text-primary" />
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                <p>Spin the Wheel</p>
                </TooltipContent>
            </Tooltip>
            </TooltipProvider>
        </div>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Spin the Wheel</DialogTitle>
                <DialogDescription>Spin the wheel for a chance to win exciting prizes!</DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
                <p className="text-muted-foreground">(Feature coming soon!)</p>
            </div>
        </DialogContent>
      </Dialog>

      {/* Live Events (Right) */}
      <Dialog>
        <div className="fixed top-1/3 right-6 z-40">
            <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-16 w-16 rounded-full shadow-lg transition-transform hover:scale-110 bg-background/80 backdrop-blur-sm border-2 border-primary/20">
                            <Calendar className="h-8 w-8 text-primary" />
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="left" className="mr-2">
                    <p>Live Events</p>
                </TooltipContent>
            </Tooltip>
            </TooltipProvider>
        </div>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Live Events</DialogTitle>
                <DialogDescription>Check out the schedule for upcoming live events and tournaments.</DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
                <p className="text-muted-foreground">(Feature coming soon!)</p>
            </div>
        </DialogContent>
      </Dialog>
      
      {/* Monthly Gifting Contest (Right) */}
      <div className="fixed top-1/2 right-6 z-40">
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href="/contest">
                        <Button variant="secondary" size="icon" className="h-16 w-16 rounded-full shadow-lg transition-transform hover:scale-110 bg-background/80 backdrop-blur-sm border-2 border-primary/20">
                            <Ticket className="h-8 w-8 text-primary" />
                        </Button>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="left" className="mr-2">
                    <p>Monthly Gifting Contest</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>

      <FloatingChatButton />
    </div>
  );
}
