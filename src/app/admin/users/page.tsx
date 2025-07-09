
"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserX, Eye, AlertTriangle } from 'lucide-react';
import { getAllUsers, type UserProfile } from '@/lib/users';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const userList = await getAllUsers();
        setUsers(userList);
      } catch (error) {
        console.error("Failed to fetch users (check Firestore rules):", error);
        setError("Failed to fetch users. This is likely a Firestore security rule issue. Please ensure admins have 'read' and 'list' access to the 'users' collection in your Firestore rules.");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading users...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center py-8 text-destructive bg-destructive/10 rounded-lg">
           <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
           <p className="font-semibold">Error Loading Users</p>
           <p className="text-sm mt-1">{error}</p>
        </div>
      );
    }

    if (users.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No users found.</p>;
    }

    return (
       <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>UID</TableHead>
              <TableHead>Joined On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.displayName || 'N/A'}</TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell>@{user.username || 'N/A'}</TableCell>
                <TableCell className="font-mono text-xs">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="cursor-pointer underline decoration-dotted">{user.uid.substring(0, 8)}...</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{user.uid}</p>
                        </TooltipContent>
                    </Tooltip>
                </TableCell>
                <TableCell>
                  {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View User</span>
                  </Button>
                  <Button variant="destructive" size="icon">
                    <UserX className="h-4 w-4" />
                    <span className="sr-only">Disable User</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>View, manage, and take action on user accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
