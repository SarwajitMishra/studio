
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GAMES } from '@/lib/constants';
import { ArrowRight, Brain, Heart, Puzzle, Rocket } from 'lucide-react';
import { S_COINS_ICON as SCoinsIcon, S_POINTS_ICON as SPointsIcon } from '@/lib/constants';
import DateTimeWidget from '@/components/layout/DateTimeWidget';
import VisitorCountWidget from '@/components/layout/VisitorCountWidget';

const learningSections = [
    {
        title: "Math Puzzles",
        description: "Sharpen your mind with fun number challenges.",
        Icon: Brain,
        color: "text-blue-500"
    },
    {
        title: "Word Games",
        description: "Expand your vocabulary with engaging wordplay.",
        Icon: Puzzle,
        color: "text-green-500"
    },
    {
        title: "Memory Boosters",
        description: "Enhance your recall with memory-matching fun.",
        Icon: Heart,
        color: "text-red-500"
    },
    {
        title: "Creative Play",
        description: "Unleash your imagination in creative sandboxes.",
        Icon: Rocket,
        color: "text-purple-500"
    }
];

const upcomingFeatures = [
    "User-made puzzle editor",
    "Weekly leaderboards",
    "Profile avatar customizations",
    "Android app release",
    "New game releases"
];

const featuredGames = GAMES.filter(g => !g.disabled).slice(0, 5);

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative text-center py-20 sm:py-32 bg-orange-50 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10" 
          style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/az-subtle.png')"}}
          data-ai-hint="chalkboard texture"
        ></div>
        <div className="container relative z-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-primary tracking-tight">
            Shravya PlayLab
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-foreground/80 font-medium">
            "Where Curiosity Meets Fun!"
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <Link href="/signup">Sign Up</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto">
              <Link href="/dashboard">Continue as Guest</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Games */}
      <section className="py-16 bg-background">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">Featured Games</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {featuredGames.map((game) => (
              <Card key={game.id} className="group overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="p-0">
                   <div className="relative h-40 w-full">
                       <Image 
                           src={`https://placehold.co/400x300.png`} // Placeholder
                           alt={game.title}
                           fill
                           className="object-cover transition-transform duration-300 group-hover:scale-105"
                           data-ai-hint={game.title.toLowerCase()}
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                       <game.Icon className="absolute bottom-3 left-3 h-8 w-8 text-white drop-shadow-lg" />
                   </div>
                </CardHeader>
                <CardContent className="p-4">
                    <CardTitle className="text-lg">{game.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{game.description}</p>
                     <Button asChild variant="link" className="p-0 mt-2">
                        <Link href={game.href}>Play Now <ArrowRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards Section */}
      <section className="py-16 bg-orange-50">
        <div className="container grid md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold">S-Coins & Rewards</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Earn S-Points <SPointsIcon className="inline-block text-yellow-400" /> for playing and achieving milestones. Convert them into valuable S-Coins <SCoinsIcon className="inline-block text-amber-500" /> to unlock exclusive content in our shop!
            </p>
            <div className="mt-6 flex gap-4 justify-center md:justify-start">
                 <Button asChild size="lg" className="bg-primary/90 hover:bg-primary">
                    <Link href="/shop">Start Earning Rewards!</Link>
                </Button>
                 <Button asChild size="lg" variant="outline">
                    <Link href="/shop">Visit the Shop</Link>
                </Button>
            </div>
          </div>
           <div className="relative h-64">
              <Image 
                src="https://placehold.co/600x400.png" 
                alt="Rewards visual" 
                fill 
                className="object-contain rounded-2xl"
                data-ai-hint="coins treasure"
               />
          </div>
        </div>
      </section>

       {/* Learning Meets Gaming */}
       <section className="py-16 bg-background">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">Learning Meets Gaming</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {learningSections.map((section) => (
                    <Card key={section.title} className="text-center p-6 shadow-md hover:shadow-lg transition-shadow">
                        <section.Icon className={`mx-auto h-12 w-12 ${section.color}`} />
                        <h3 className="mt-4 text-xl font-semibold">{section.title}</h3>
                        <p className="mt-2 text-muted-foreground">{section.description}</p>
                    </Card>
                ))}
           </div>
        </div>
      </section>

      {/* Upcoming Features */}
      <section className="py-16 bg-orange-50">
          <div className="container">
             <h2 className="text-3xl font-bold text-center mb-8">Coming Soon to the PlayLab!</h2>
             <div className="max-w-2xl mx-auto">
                 <Card className="p-6 bg-background/50">
                     <ul className="space-y-3">
                        {upcomingFeatures.map((feature, index) => (
                             <li key={index} className="flex items-center text-lg">
                                <Rocket className="h-5 w-5 mr-3 text-primary" />
                                <span>{feature}</span>
                            </li>
                        ))}
                     </ul>
                 </Card>
             </div>
          </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h3 className="font-bold text-white mb-2">Shravya PlayLab</h3>
              <p className="text-sm">A project by the Shravya Foundation, dedicated to making learning accessible and fun.</p>
              <div className="mt-4">
                  <a href="mailto:hello@shravya.foundation" className="text-sm hover:text-white">hello@shravya.foundation</a>
              </div>
            </div>
            <div>
                <h3 className="font-bold text-white mb-2">Quick Links</h3>
                <ul className="space-y-1 text-sm">
                    <li><Link href="/info" className="hover:text-white">About Us</Link></li>
                    <li><Link href="/privacy-policy" className="hover:text-white">Privacy & Child Safety</Link></li>
                    <li><Link href="/contact-us" className="hover:text-white">Contact</Link></li>
                </ul>
            </div>
             <div>
                <h3 className="font-bold text-white mb-2">Session Info</h3>
                <div className="text-sm space-y-2">
                    <DateTimeWidget />
                    <VisitorCountWidget />
                </div>
            </div>
          </div>
           <Separator className="my-6 bg-gray-700" />
           <p className="text-center text-xs">&copy; {new Date().getFullYear()} Shravya Foundation. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
