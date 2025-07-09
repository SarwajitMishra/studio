import CreateBlogForm from '@/components/blog/CreateBlogForm';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateBlogPage() {
  return (
    <div className="space-y-6">
      <Button asChild variant="outline">
        <Link href="/blogs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog Posts
        </Link>
      </Button>
      <CreateBlogForm />
    </div>
  );
}
