
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from 'next';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Shravya Playhouse team.',
};

export default function ContactUsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Contact Us</CardTitle>
          <CardDescription>We'd love to hear from you! Reach out with any questions, comments, or feedback.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-muted-foreground">For general inquiries, support, or feedback:</p>
                <a href="mailto:help.shravyaplayhouse@gmail.com" className="text-primary hover:underline">help.shravyaplayhouse@gmail.com</a>
              </div>
            </div>
             <div className="flex items-start gap-4">
              <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Phone</h3>
                <p className="text-muted-foreground">(Coming Soon)</p>
              </div>
            </div>
             <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Address</h3>
                <p className="text-muted-foreground">Our virtual doors are always open!</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
             <h3 className="text-xl font-semibold border-b pb-2">Send us a message</h3>
             <form className="space-y-4" action="mailto:help.shravyaplayhouse@gmail.com" method="get" encType="text/plain">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="subject" placeholder="Your Name" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" name="body" placeholder="Your message..." rows={5} />
                </div>
                <Button type="submit" className="w-full">Send Email</Button>
             </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
