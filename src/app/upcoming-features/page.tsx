
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from 'next';
import { Rocket, Trophy, Dice6, Store, Bot, ShieldCheck, Paintbrush } from 'lucide-react';
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: 'Upcoming Features',
  description: 'A sneak peek at what\'s coming next to Shravya Playhouse!',
};

const features = [
  {
    title: "Global Leaderboards",
    description: "Compete with players from around the world! See how your high scores in games like Typing Rush and Chess stack up against the best.",
    Icon: Trophy,
    color: "text-yellow-500",
  },
  {
    title: "Multiplayer Ludo & Snakes and Ladders",
    description: "Challenge your friends to these classic board games online. Create a session, share the code, and let the fun begin!",
    Icon: Dice6,
    color: "text-green-500",
  },
  {
    title: "Avatar Item Shop",
    description: "Spend your hard-earned S-Coins in the new shop! Unlock cool hats, custom backgrounds, and unique accessories for your profile avatar.",
    Icon: Store,
    color: "text-blue-500",
  },
  {
    title: "Advanced AI Tutors",
    description: "New AI-powered learning games that adapt to your skill level, offering personalized challenges in math, language, and logic.",
    Icon: Bot,
    color: "text-purple-500",
  },
  {
    title: "Theme Customizer",
    description: "Go beyond preset colors! A new theme customizer will let you pick your own primary and accent colors to make the app truly yours.",
    Icon: Paintbrush,
    color: "text-pink-500",
  },
   {
    title: "Parental Dashboard V2",
    description: "An improved dashboard for parents to track learning progress, set screen time limits, and manage content permissions.",
    Icon: ShieldCheck,
    color: "text-orange-500",
  },
];

export default function UpcomingFeaturesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center py-8 bg-primary/10 rounded-lg shadow-inner">
          <Rocket size={48} className="mx-auto text-primary animate-pulse" />
          <h1 className="mt-4 text-4xl font-bold text-primary tracking-tight">What's Coming Next?</h1>
          <p className="mt-3 text-lg text-foreground/80 max-w-2xl mx-auto">
              We're always working on new ways to make Shravya Playhouse more fun and educational. Here's a sneak peek at what's on our roadmap!
          </p>
      </header>
      
      <div className="space-y-6">
        {features.map((feature, index) => (
          <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
               <div className={cn("p-3 rounded-full bg-muted", feature.color)}>
                  <feature.Icon className="h-6 w-6" />
                </div>
              <div className="flex-grow">
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription className="pt-1">{feature.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
       <p className="text-center text-sm text-muted-foreground pt-4">
            Release dates are subject to change. Stay tuned for more updates!
        </p>
    </div>
  );
}
