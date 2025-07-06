
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hash } from "lucide-react";
import Link from "next/link";

export default function TicTacToePage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <Hash className="mx-auto h-16 w-16 text-orange-500" />
          <CardTitle className="mt-4 text-3xl font-bold">Tic-Tac-Toe</CardTitle>
          <CardDescription className="text-lg">This game is coming soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Get ready to challenge your friends in the classic game of X's and O's.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
