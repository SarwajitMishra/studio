
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from 'next';
import { Lightbulb } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const metadata: Metadata = {
  title: 'Request a Feature',
  description: 'Share your ideas and feedback with the Shravya Playhouse team.',
};

export default function RequestFeaturePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-3">
            <Lightbulb className="h-8 w-8" />
            Request a Feature or Give Feedback
          </CardTitle>
          <CardDescription>Have a great idea for a new game or an improvement? We want to hear it!</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" action="mailto:help.shravyaplayhouse@gmail.com" method="get" encType="text/plain">
             <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" placeholder="e.g., Idea for a new space-themed game" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="type">Feedback Type</Label>
                <Select name="type">
                    <SelectTrigger id="type">
                        <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Feature Request">Feature Request</SelectItem>
                        <SelectItem value="Bug Report">Bug Report</SelectItem>
                        <SelectItem value="General Feedback">General Feedback</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="body">Your Idea / Feedback</Label>
                <Textarea id="body" name="body" placeholder="Describe your idea or feedback in as much detail as possible..." rows={8} required />
            </div>
            <Button type="submit" className="w-full text-lg">Send Feedback via Email</Button>
            <p className="text-xs text-center text-muted-foreground pt-2">
                This will open your default email client to send the message.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
