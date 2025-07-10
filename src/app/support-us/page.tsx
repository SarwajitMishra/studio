
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Share2, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function SupportUsPage() {
  const { toast } = useToast();

  const handleShare = async () => {
    const shareData = {
      title: 'Shravya Playhouse',
      text: 'Check out this cool and fun educational gaming app for kids!',
      url: window.location.origin + '/dashboard'
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for desktop browsers
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link Copied!",
          description: "The dashboard link has been copied to your clipboard. Thanks for sharing!",
        });
      }
    } catch (error) {
      // Don't show an error if the user cancels the share sheet
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Share action was cancelled by the user.');
        return;
      }
      
      console.error("Error sharing:", error);
      toast({
        variant: "destructive",
        title: "Could not share",
        description: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg text-center">
        <CardHeader>
          <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Support Shravya Playhouse</CardTitle>
          <CardDescription>
            Your support helps us keep the platform ad-free, safe, and constantly improving with new games and features.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8 pt-6">
          <div className="p-6 bg-muted rounded-lg space-y-3">
            <Share2 className="h-8 w-8 mx-auto text-accent"/>
            <h3 className="text-xl font-semibold">Spread the Word</h3>
            <p className="text-muted-foreground">
              The best way to support us is by sharing Shravya Playhouse with friends and family who might enjoy it.
            </p>
            <Button onClick={handleShare} variant="outline">Share Now</Button>
          </div>
           <div className="p-6 bg-muted rounded-lg space-y-3">
            <Star className="h-8 w-8 mx-auto text-accent"/>
            <h3 className="text-xl font-semibold">Leave a Review</h3>
            <p className="text-muted-foreground">
              Leaving a positive review on app stores or social media helps us reach more families.
            </p>
            <Button variant="outline" disabled>Rate Us (Coming Soon)</Button>
          </div>
          <div className="p-6 bg-muted rounded-lg md:col-span-2 space-y-3">
            <Heart className="h-8 w-8 mx-auto text-accent"/>
            <h3 className="text-xl font-semibold">Future Donations</h3>
            <p className="text-muted-foreground">
              We plan to introduce a secure way for those who wish to contribute financially to do so. Stay tuned for updates!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
