
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content & Community Guidelines',
  description: 'Guidelines for participating in the Shravya Playlab community.',
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Content & Community Guidelines</CardTitle>
           <CardDescription>Help us keep Shravya Playlab a safe, fun, and respectful environment for everyone.</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4">
          <p>Welcome to the Shravya Playlab community! To ensure a positive experience for all users, we ask that you adhere to the following guidelines, especially for features like blogs, essays, and leaderboards.</p>
          
          <section>
            <h3>1. Be Respectful and Kind</h3>
            <p>Treat others as you would like to be treated. Do not post content that is harmful, offensive, abusive, or uses inappropriate language. Harassment of any kind will not be tolerated.</p>
          </section>

          <section>
            <h3>2. Keep Content Kid-Friendly</h3>
            <p>All user-generated content, such as blog posts or essays, must be appropriate for all ages. Content that is violent, scary, or otherwise unsuitable for children will be removed.</p>
          </section>

          <section>
            <h3>3. No Cheating or Unfair Play</h3>
            <p>Play games fairly. The use of bots, scripts, or any form of cheating to gain an advantage on leaderboards or in contests is strictly prohibited. We periodically review leaderboards for fairness and reserve the right to disqualify users who violate this rule.</p>
          </section>

          <section>
            <h3>4. Content Moderation</h3>
            <p>To ensure safety, all user-submitted content (such as blogs and essays) will be reviewed by our moderation team before it is published on the platform. We reserve the right to reject or remove any content that violates these guidelines without notice.</p>
          </section>

          <section>
            <h3>5. Originality and Plagiarism</h3>
            <p>All submitted content must be your own original work. Plagiarized content or content primarily written by AI generation tools may be rejected to encourage genuine creativity and learning.</p>
          </section>

          <section>
            <h3>6. Consequences for Violations</h3>
            <p>Violating these community guidelines may result in actions such as content removal, temporary suspension of feature access (e.g., blog writing), or, for severe or repeated violations, permanent account termination.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
