"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function BlogsPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <BookOpen className="text-primary" /> Playhouse Blogs
          </CardTitle>
          <CardDescription>
            This feature is coming soon!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Read articles from our team about game strategies, learning tips, and upcoming features.</p>
          <Button asChild className="mt-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go to Homepage
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
