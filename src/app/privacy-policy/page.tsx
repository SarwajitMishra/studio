
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how our app collects, uses, and protects your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Privacy Policy</CardTitle>
          <div className="text-xs text-muted-foreground pt-1">
            <p>Effective Date: 10 July 2025</p>
            <p>Last Updated: 10 July 2025</p>
          </div>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4">
          <p>Shravya PlayLab is committed to protecting the privacy of our users, especially children. This policy outlines how we collect, use, and safeguard your information.</p>

          <section>
            <h3>1. What Information We Collect</h3>
            <p>We collect information to provide and improve our service. This includes:</p>
            <ul>
              <li><strong>Voluntarily Provided Information:</strong> Display Name, chosen Avatar, and Parent's Email (for account login and parental controls).</li>
              <li><strong>Gameplay Information:</strong> Game scores, progress, badges earned, S-Points, and S-Coins.</li>
              <li><strong>Automatically Collected Information:</strong> We may collect non-personal device information (like device type and operating system) and usage data for bug fixing and performance analytics. We do not collect personally identifiable information automatically.</li>
            </ul>
          </section>

          <section>
            <h3>2. How We Use Your Information</h3>
            <p>Your data is used solely for the following purposes:</p>
            <ul>
              <li>To create and personalize your in-game experience.</li>
              <li>To save and display your game progress and achievements.</li>
              <li>To enable leaderboards and contests (participation is optional).</li>
              <li>To manage the S-Points and S-Coins rewards system.</li>
              <li>To analyze app performance and fix technical issues.</li>
            </ul>
          </section>
          
          <section>
            <h3>3. Child Data and COPPA Compliance</h3>
            <p>Shravya PlayLab is designed for a general audience but includes content suitable for children. We are committed to complying with the Children's Online Privacy Protection Act (COPPA). We do not knowingly collect personal information from children under 13 without verifiable parental consent. Features requiring personal data, like parental dashboards, will require consent from a parent or guardian.</p>
          </section>

          <section>
            <h3>4. Data Sharing and Third Parties</h3>
            <p>We do **not** sell, trade, or share your personal information with third parties for marketing purposes. Data may be shared with trusted cloud service providers (like Google Firebase) for the sole purpose of hosting the application and storing game data securely. These providers are bound by strict data protection agreements.</p>
          </section>
          
          <section>
            <h3>5. Data Security</h3>
            <p>We implement a variety of security measures to maintain the safety of your personal information. All data is stored on secure servers, and we use industry-standard encryption for data transmission.</p>
          </section>
          
          <section>
            <h3>6. Your Rights and Choices</h3>
            <p>You have the right to access, update, or delete your personal information. Parents can review their child’s information and request its deletion by contacting us. Please note that deleting certain data may impact the gameplay experience (e.g., loss of progress).</p>
          </section>

          <section>
            <h3>7. Cookies and Analytics</h3>
            <p>We use minimal, non-personal cookies for essential functions like maintaining your login session and tracking game performance. For more details, please see our <a href="/cookies-policy">Cookies Policy</a>.</p>
          </section>
          
          <section>
            <h3>8. Changes to This Policy</h3>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.</p>
          </section>

          <section>
            <h3>9. Contact Us</h3>
            <p>If you have any questions or concerns about our privacy practices, please contact us at: <a href="mailto:hello@shravya.foundation">hello@shravya.foundation</a></p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
