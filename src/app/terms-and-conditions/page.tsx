
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Read the terms and conditions for using Shravya Playhouse.',
};

export default function TermsAndConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Terms and Conditions</CardTitle>
          <div className="text-xs text-muted-foreground pt-1">
            <p>Effective Date: 10 July 2025</p>
            <p>Last Updated: 10 July 2025</p>
          </div>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4">
          <p>Welcome to **Shravya Playhouse**! These terms and conditions outline the rules and regulations for the use of our gaming platform.</p>

          <section>
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing or using our platform, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree with any part of these terms, you must not use the service. Use of the platform by a minor is subject to the consent of their parent or legal guardian.</p>
          </section>

          <section>
            <h3>2. Eligibility and Parental Supervision</h3>
            <p>This platform is designed for children, but must be used under the supervision of a parent or legal guardian. Parents or guardians are responsible for managing accounts and activities for children under the age of 13, in compliance with the Children's Online Privacy Protection Act (COPPA).</p>
          </section>

          <section>
            <h3>3. Use of the Platform</h3>
            <p>You agree to use Shravya Playhouse only for its intended purposes. The following activities are strictly prohibited:</p>
            <ul>
              <li>Engaging in any illegal or unauthorized activities.</li>
              <li>Exploiting software bugs, glitches, or using cheats to gain an unfair advantage.</li>
              <li>Attempting to duplicate, reproduce, sell, or resell any part of the service or its content without our express written permission.</li>
              <li>Harassing, abusing, or harming another person or user.</li>
            </ul>
          </section>

          <section>
            <h3>4. Rewards System (S-Points and S-Coins)</h3>
            <p>S-Points and S-Coins are virtual reward points earned through gameplay. They are intended to enhance the gaming experience and do not hold any real-world monetary value, except where explicitly stated in the context of official gift contests or promotional events organized by Shravya Playhouse.</p>
          </section>

          <section>
            <h3>5. Account Security</h3>
            <p>You are responsible for safeguarding your login credentials. You must notify us immediately of any unauthorized use of your account. Shravya Playhouse cannot be held liable for any loss or damage arising from your failure to protect your account information.</p>
          </section>
          
          <section>
            <h3>6. Content Ownership and Intellectual Property</h3>
            <p>All game designs, artwork, characters, icons, and other content on the Shravya Playhouse platform are the exclusive property of Shravya Playhouse and are protected by copyright and other intellectual property laws, unless otherwise credited. You may not use any of our content without prior written consent.</p>
          </section>

          <section>
            <h3>7. Termination of Service</h3>
            <p>We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms and Conditions or is harmful to other users of the platform, us, or third parties, or for any other reason.</p>
          </section>
          
          <section>
            <h3>8. Disclaimer of Warranties</h3>
            <p>The platform is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.</p>
          </section>

          <section>
            <h3>9. Limitation of Liability</h3>
            <p>In no event shall Shravya Playhouse, nor its directors, employees, or agents, be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the platform.</p>
          </section>

          <section>
            <h3>10. Changes to These Terms</h3>
            <p>We may modify these terms at any time. We will notify you of any changes by posting the new Terms and Conditions on this page. You are advised to review this page periodically for any changes.</p>
          </section>

          <section>
            <h3>11. Contact Information</h3>
            <p>For any questions or support inquiries regarding these terms, please contact us at: <a href="mailto:support@shravya-playhouse.com">support@shravya-playhouse.com</a></p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
