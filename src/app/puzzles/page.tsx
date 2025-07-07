
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Puzzle } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: 'Puzzles Moved',
};

export default function PuzzlesPage() {
  return (
    <div className="space-y-10">
      <Card className="shadow-xl">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-3xl font-bold text-center text-primary flex items-center justify-center gap-3">
             <Puzzle size={36} /> Puzzles Have Moved!
          </CardTitle>
          <CardDescription className="text-center text-lg text-foreground/80 pt-2">
            To make things easier, all our fun puzzles are now listed directly on the homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center">
            <p className="mb-4">You can find Jigsaw, Sudoku, Memory Matching and more right on the main page.</p>
            <Button asChild variant="default" className="mt-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/">
                Go to Homepage <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
