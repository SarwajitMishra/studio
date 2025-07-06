
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleDot } from "lucide-react";
import Link from "next/link";

export default function ConnectFourPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <CircleDot className="mx-auto h-16 w-16 text-red-600" />
          <CardTitle className="mt-4 text-3xl font-bold">Connect Four</CardTitle>
          <CardDescription className="text-lg">This game is coming soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Prepare your strategy to connect four of your discs in a row before your opponent does.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
