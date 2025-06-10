
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PUZZLE_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: 'Kid Puzzles',
};

export default function PuzzlesPage() {
  return (
    <div className="space-y-10">
      <Card className="shadow-xl">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-3xl font-bold text-center text-primary">Kid Puzzles Collection</CardTitle>
          <CardDescription className="text-center text-lg text-foreground/80 pt-2">
            Fun and engaging puzzles to boost learning and problem-solving skills!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PUZZLE_TYPES.map((puzzle) => (
              <Card key={puzzle.id} id={puzzle.id} className="group flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg overflow-hidden transform hover:-translate-y-1 hover:animate-gentle-bounce">
                <CardHeader className="bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <puzzle.Icon size={36} className={cn("text-primary group-hover:scale-110 transition-transform duration-300", puzzle.color)} />
                    <CardTitle className="text-xl font-semibold text-foreground">{puzzle.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col">
                  <p className="text-sm text-foreground/80 mb-4 flex-grow">{puzzle.description}</p>
                  {puzzle.href && !puzzle.disabled ? (
                    <Button asChild variant="default" className="mt-auto bg-accent text-accent-foreground hover:bg-accent/90 w-full">
                      <Link href={puzzle.href}>
                        Play {puzzle.name} <ArrowRight size={16} className="ml-2" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button variant="default" className="mt-auto bg-accent text-accent-foreground hover:bg-accent/90 w-full" disabled>
                        Play {puzzle.name} <ArrowRight size={16} className="ml-2" />
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">(Coming Soon!)</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
