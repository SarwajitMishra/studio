
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateBlogPage() {
  return (
    <div className="space-y-6">
       <Card className="w-full max-w-lg mx-auto text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Wrench className="text-primary"/> Feature Under Maintenance
          </CardTitle>
          <CardDescription>
            The blog creation feature is currently being improved and is temporarily unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="mb-4">Please check back soon!</p>
            <Button asChild>
                <Link href="/blogs">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Posts
                </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
