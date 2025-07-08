
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contest & Rewards Policy',
  description: 'Rules and policies for participating in contests at Shravya Playhouse.',
};

export default function ContestPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Contest & Rewards Policy</CardTitle>
           <CardDescription>Official rules for participating in contests and earning rewards on Shravya Playhouse.</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4">
          <p>Shravya Playhouse regularly hosts contests to reward our dedicated players. Please read the following rules carefully.</p>
          
          <section>
            <h3>1. Eligibility</h3>
            <p>All registered users are eligible to participate in contests, subject to any specific age or regional restrictions mentioned in the contest announcement. Accounts found to be in violation of our Terms and Conditions will be disqualified.</p>
          </section>

          <section>
            <h3>2. How to Enter</h3>
            <p>Participation in our monthly contests may require an entry fee payable in S-Coins. The entry fee is non-refundable. Each user is typically limited to one entry per contest period unless otherwise specified.</p>
          </section>
          
          <section>
            <h3>3. Winner Selection and Notification</h3>
            <p>Winners are typically selected based on leaderboard performance, high scores, or other criteria clearly defined in the contest announcement. Winners will be notified via in-app notifications and, if applicable, through the parent's registered email address. Results are final once published.</p>
          </section>

          <section>
            <h3>4. Prize Fulfillment for Physical Gifts</h3>
            <p>For contests with physical gift hampers as prizes, the following conditions apply:</p>
            <ul>
              <li>A parent or legal guardian must verify the shipping address through our secure parental dashboard.</li>
              <li>Shipping is currently available only in selected regions (e.g., India only). This will be clearly stated in the contest rules.</li>
              <li>Shravya Playhouse is not responsible for any customs fees, duties, or taxes that may apply to international shipping if it becomes available in the future.</li>
            </ul>
          </section>
          
          <section>
            <h3>5. General Conditions</h3>
            <p>We reserve the right to cancel, suspend, or modify any contest if fraud, technical failures, or any other factor beyond our reasonable control impairs the integrity of the contest. We also reserve the right to disqualify any individual found to be tampering with the entry process or the operation of the contest or to be acting in violation of these rules.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
