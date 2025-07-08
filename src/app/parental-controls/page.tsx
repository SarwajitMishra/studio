
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parental Controls & Consent',
  description: 'Information about parental controls and consent policies at Shravya Playhouse.',
};

export default function ParentalControlsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Parental Controls & Consent Policy</CardTitle>
           <CardDescription>A guide for parents and guardians to manage their child's experience on Shravya Playhouse.</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4">
          <p>At Shravya Playhouse, we believe in creating a safe and positive digital environment for children. We provide parents and guardians with tools to supervise and manage their child's account and activities.</p>
          
          <section>
            <h3>1. Verifiable Parental Consent (COPPA)</h3>
            <p>In compliance with the Children's Online Privacy Protection Act (COPPA), we require verifiable parental consent before collecting any personal information from children under the age of 13. This is typically done through an email verification process when a parent creates or links an account.</p>
          </section>

          <section>
            <h3>2. Parental Dashboard Features</h3>
            <p>Once a parent has verified their account, they gain access to a parental dashboard (accessible via the main Profile page) with the following controls:</p>
            <ul>
              <li><strong>View Progress Card:</strong> Monitor your child's achievements, game statistics, and rewards earned.</li>
              <li><strong>Approve/Reject Content (Future Feature):</strong> For features like blog writing or essay submissions, parents will have the ability to review and approve content before it is made public.</li>
              <li><strong>Set Screen Time Limits (In Development):</strong> We are working on features to help you manage your child's daily playtime on the platform.</li>
              <li><strong>Manage Gift Redemption:</strong> Securely provide and verify a shipping address for any physical gifts won in our monthly contests. This information is used solely for the purpose of prize fulfillment.</li>
              <li><strong>Delete Account Data:</strong> Parents have the right to request the deletion of their child's account and all associated data at any time by contacting our support team.</li>
            </ul>
          </section>

          <section>
            <h3>3. Our Commitment to Safety</h3>
            <p>Our platform is designed to be a safe space for learning and play. We do not feature open chat systems between users, and all community-facing content (like blogs) is planned to be moderated. We encourage parents to have open conversations with their children about online safety.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
