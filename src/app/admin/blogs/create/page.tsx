import CreateBlogForm from '@/components/blog/CreateBlogForm';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminCreateBlogPage() {
    return (
        <div className="space-y-6">
           <Button asChild variant="outline">
            <Link href="/admin/blogs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog Management
            </Link>
          </Button>
          {/* Admins now use the same form, which creates a 'pending' post they can then publish. */}
          <CreateBlogForm />
        </div>
      );
}
