
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToyBrick } from "lucide-react";
import Link from "next/link";

export default function TowerOfHanoiPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <ToyBrick className="mx-auto h-16 w-16 text-teal-600" />
          <CardTitle className="mt-4 text-3xl font-bold">Tower of Hanoi</CardTitle>
          <CardDescription className="text-lg">This game is coming soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Get ready to solve the classic puzzle of moving disks from one tower to another.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
