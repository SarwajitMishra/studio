
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookMarked, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Client component to inject metadata
const HeadMetadata = () => {
  return (
    <>
      <title>Easy English Fun | Shravya Playhouse</title>
      <meta name="description" content="Learn basic English words and concepts with fun puzzles at Shravya Playhouse!" />
    </>
  );
};

export default function EasyEnglishPuzzlePage() {
  return (
    <>
      <HeadMetadata />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-center space-x-3">
              <BookMarked size={36} className="text-indigo-500" />
              <CardTitle className="text-3xl font-bold text-primary">Easy English Fun</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-6">
            <BookMarked size={64} className={cn("mx-auto mb-4 text-indigo-500 opacity-70")} />
            <CardDescription className="text-xl text-foreground/80">
              Learn basic English words and concepts in a fun, interactive way!
            </CardDescription>
            <p className="text-2xl font-semibold text-accent animate-pulse">
              Interactive English Puzzles Coming Soon!
            </p>
            <p className="text-md text-muted-foreground">
              Get ready for word matching, picture association, simple spelling games, and more!
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/puzzles">
                <ArrowLeft size={16} className="mr-2" /> Back to All Puzzles
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
