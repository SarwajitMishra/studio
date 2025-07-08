
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookies Policy',
  description: 'Understand how Shravya Playhouse uses cookies to enhance your experience.',
};

export default function CookiesPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Cookies Policy</CardTitle>
          <div className="text-xs text-muted-foreground pt-1">
            <p>Effective Date: 10 July 2025</p>
            <p>Last Updated: 10 July 2025</p>
          </div>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4">
          <p>This Cookies Policy explains how Shravya Playhouse uses cookies and similar technologies to recognize you when you visit our platform. It explains what these technologies are and why we use them, as well as your rights to control our use of them.</p>

          <section>
            <h3>1. What Are Cookies?</h3>
            <p>Cookies are small text files stored on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work more efficiently and to provide information to the site owners. They can remember your preferences, keep you logged in, and help analyze site performance.</p>
          </section>

          <section>
            <h3>2. How We Use Cookies</h3>
            <p>Shravya Playhouse uses minimal cookies to ensure a smooth and functional gameplay experience. We do not use third-party cookies for advertising or invasive tracking. Our cookies fall into the following categories:</p>
            <ul>
              <li><strong>Essential Cookies:</strong> These cookies are strictly necessary to provide you with services available through our platform, such as maintaining your login session and saving game progress locally.</li>
              <li><strong>Performance and Analytics Cookies:</strong> These cookies collect anonymous information about how users interact with our games, such as which games are most popular and where errors occur. This helps us improve the platform for everyone.</li>
              <li><strong>Functional Cookies:</strong> These cookies are used to remember choices you make, such as your preferred theme (light/dark mode) or volume settings. Their purpose is to provide a more personalized experience.</li>
            </ul>
          </section>
          
          <section>
            <h3>3. Your Control Over Cookies</h3>
            <p>You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by setting or amending your web browser controls. If you choose to reject cookies, you may still use our platform, though your access to some functionality and areas may be restricted.</p>
            <p>Most browsers allow you to:</p>
            <ul>
              <li>See what cookies you've got and delete them on an individual basis.</li>
              <li>Block third-party cookies.</li>
              <li>Block cookies from particular sites.</li>
              <li>Block all cookies from being set.</li>
              <li>Delete all cookies when you close your browser.</li>
            </ul>
            <p>Please note that blocking essential cookies may significantly impact the functionality of Shravya Playhouse.</p>
          </section>

          <section>
            <h3>4. Changes to This Policy</h3>
            <p>We may update this Cookies Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please re-visit this policy regularly to stay informed.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
