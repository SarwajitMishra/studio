
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GAMES } from '@/lib/constants';
import { ArrowRight, Brain, Heart, Puzzle, Rocket, PlaySquare, PenSquare, Gift } from 'lucide-react';
import { S_COINS_ICON as SCoinsIcon, S_POINTS_ICON as SPointsIcon } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { auth, onAuthStateChanged, User } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

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

const featuredGames = GAMES.filter(g => !g.disabled);

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user || sessionStorage.getItem('guest-session')) {
        router.replace('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGuest = () => {
    sessionStorage.setItem('guest-session', 'true');
    router.replace('/dashboard');
  };

  return (
    <div className="bg-background text-foreground space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="relative text-center py-20 sm:py-32 bg-primary/5 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10" 
          style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/az-subtle.png')"}}
          data-ai-hint="chalkboard texture"
        ></div>
        <div className="container relative z-10">
          <PlaySquare className="mx-auto h-20 w-20 text-primary" />
          <h1 className="mt-4 text-5xl sm:text-6xl md:text-7xl font-extrabold text-primary tracking-tight">
            Shravya Playhouse
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-foreground/80 font-medium">
            Where Curiosity Meets Fun!
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto hover:scale-105 transition-transform">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="lg" className="w-full sm:w-auto hover:scale-105 transition-transform">
              <Link href="/signup">Sign Up</Link>
            </Button>
            <Button size="lg" variant="ghost" className="w-full sm:w-auto" onClick={handleGuest}>
              Continue as Guest
            </Button>
          </div>
        </div>
      </section>

      {/* Grid System Demonstration */}
      <section className="container">
         <h2 className="text-3xl font-bold text-center mb-2">Our Games</h2>
         <p className="text-center text-muted-foreground mb-8">Built on a responsive 12-column grid.</p>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGames.map((game, index) => (
                <div key={game.id}>
                    <Card className="group h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardHeader className="p-0">
                        <div className="relative h-48 w-full">
                            <Image 
                                src={game.image || `https://placehold.co/600x400.png`}
                                alt={game.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4">
                              <game.Icon className="h-8 w-8 text-white drop-shadow-lg" />
                              <CardTitle className="text-xl text-white mt-1 drop-shadow-lg">{game.title}</CardTitle>
                            </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                          <CardDescription>{game.description}</CardDescription>
                          <Button asChild variant="link" className="p-0 mt-2">
                              <Link href={game.href}>Play Now <ArrowRight className="ml-1 h-4 w-4" /></Link>
                          </Button>
                      </CardContent>
                    </Card>
                </div>
            ))}
         </div>
      </section>

      {/* Blog and Contest Section */}
      <section className="container grid md:grid-cols-2 gap-8">
          {/* From Our Blog */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                    <PenSquare className="h-8 w-8 text-blue-500" />
                    <CardTitle className="text-2xl font-bold">From Our Blog</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground mb-4">
                      Discover tips, stories, and behind-the-scenes looks at the creation of our games.
                  </p>
                  <Button asChild>
                      <Link href="/blogs">Read Our Blog <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
              </CardContent>
          </Card>
          
          {/* Monthly Gifting Contest */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                    <Gift className="h-8 w-8 text-red-500" />
                    <CardTitle className="text-2xl font-bold">Monthly Gifting Contest</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground mb-4">
                      Compete for high scores and win physical gift hampers! Entry is just a few S-Coins.
                  </p>
                  <Button asChild>
                      <Link href="/contest-policy">Learn More <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
              </CardContent>
          </Card>
      </section>

      {/* Rewards Section */}
      <section className="py-16 bg-primary/5">
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
           <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg group">
              <Image 
                src="/images/rewards-visual.png" 
                alt="Rewards visual" 
                fill 
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="coins treasure"
               />
          </div>
        </div>
      </section>

       {/* Learning Meets Gaming */}
       <section className="container">
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
        </section>

      {/* Upcoming Features */}
      <section className="py-16 bg-primary/5">
          <div className="container">
             <h2 className="text-3xl font-bold text-center mb-8">Coming Soon to the Playhouse!</h2>
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
    </div>
  );
}
