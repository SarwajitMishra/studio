
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar, Mail, Phone, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Static data for the blog post
const blog = {
  title: "Welcome to Shravya Playhouse – A Magical World of Learning & Fun!",
  authorName: "Team Shravya Playhouse",
  authorAvatar: "/images/custom-chat-icon.png",
  publishedAt: "2025-07-10T12:00:00.000Z",
  content: `
👋 **Hello Parents, Guardians, and our Little Superstars!**

We are incredibly excited to welcome you to Shravya Playhouse, a safe, playful, and learning-focused digital playground designed especially for children aged 3 to 12.

Born out of love and creativity on the occasion of our little angel Shravya turning 6 months old, this platform is crafted to make screen time productive, engaging, and educational.

---

### 🌟 What is Shravya Playhouse?
Shravya Playhouse is a game-based learning hub packed with:

-   🧩 Brain-tickling puzzles
-   🎮 Classic and modern strategy games
-   🎨 Creative challenges
-   📚 Easy English fun activities
-   🧠 Memory and logic games

All designed to help kids learn while having fun!

### 🎮 Current Games You Can Explore:
- Chess ♟️
- 2048 🔢
- Tower of Hanoi
- Memory Maze
- Pattern Builder
- Sudoku Challenge
- Guess the Number, Fast Math, Code Breaker
- Memory Matching, Easy English Image Games, and more!

We’ve also introduced two special rewards:
-   🥇 **S-Points** – Earned via daily play and achievements.
-   💰 **S-Coins** – Valuable coins for contests, shop items, and more!

---

### 🧩 Upcoming Features to Watch Out For:
-   🌍 Online Multiplayer Mode with parental safety controls
-   🏆 Global Leaderboards and progress cards
-   🎁 Monthly Gifting Contest – win real goodies!
-   🎨 Spin the Wheel & Daily Login Rewards
-   ✨ New Puzzle Packs, Skins, and Avatars
-   ✉️ Parent-Child Dashboard for safe monitoring and rewards

---

### 🛡️ Our Policies
Your child’s safety is our top priority. Please review our updated policies:
-   [Privacy Policy](/privacy-policy)
-   [Terms and Conditions](/terms-and-conditions)
-   [Cookies Policy](/cookies-policy)

We also give guardians complete control over their child’s profile, progress reports, gameplay time, and visibility of games.

---

### 📬 Contact Us
We love hearing from our community! Have a suggestion, issue, or just want to say hi?

-   **📧 Email:** [help.shravyaplayhouse@gmail.com](mailto:help.shravyaplayhouse@gmail.com)
-   **📱 Instagram:** [@shravyaplayhouse](https://instagram.com/shravyaplayhouse)
-   **📞 WhatsApp Support:** [Message us on WhatsApp](https://wa.me/message/4XRZPF6RLB6KC1)

🎈 Thank you for joining this journey with us. Let's make learning joyful and magical – together!

With love,  
**Team Shravya Playhouse** 💖
  `,
};

export const metadata: Metadata = {
  title: blog.title,
  description: "Welcome to Shravya Playhouse, a safe, playful, and learning-focused digital playground designed especially for children.",
};

export default function StaticBlogPostPage() {
  return (
    <article className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{blog.title}</h1>
        <div className="flex items-center justify-center gap-4 text-muted-foreground">
             <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={blog.authorAvatar} />
                    <AvatarFallback><User size={16}/></AvatarFallback>
                </Avatar>
                <span>{blog.authorName}</span>
            </div>
             <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                   {new Date(blog.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>
        </div>
      </header>
      
      <div className="prose dark:prose-invert lg:prose-xl max-w-none mx-auto bg-card p-6 rounded-lg shadow-sm">
        <ReactMarkdown
          components={{
            a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />,
          }}
        >{blog.content}</ReactMarkdown>
      </div>

       <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">Comments</h2>
         <Card>
          <CardHeader>
            <CardTitle>Leave a Comment</CardTitle>
            <CardDescription>Comments are coming soon!</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Check back later to share your thoughts on this post.</p>
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
