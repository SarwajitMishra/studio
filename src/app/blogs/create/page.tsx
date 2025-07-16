
import CreateBlogForm from '@/components/blog/CreateBlogForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function CreateBlogPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
          <CreateBlogForm />
        </div>
      );
}
