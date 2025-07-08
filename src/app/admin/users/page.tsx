import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>View, manage, and take action on user accounts. (Using placeholder data)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined On</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Admin User</TableCell>
              <TableCell>admin@example.com</TableCell>
              <TableCell><Badge>Active</Badge></TableCell>
              <TableCell>2023-10-26</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">View</Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Guest Player</TableCell>
              <TableCell>N/A</TableCell>
              <TableCell><Badge variant="secondary">Guest</Badge></TableCell>
              <TableCell>N/A</TableCell>
              <TableCell>
                 <Button variant="outline" size="sm" disabled>View</Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Disabled User</TableCell>
              <TableCell>violator@example.com</TableCell>
              <TableCell><Badge variant="destructive">Disabled</Badge></TableCell>
              <TableCell>2023-09-15</TableCell>
              <TableCell>
                 <Button variant="outline" size="sm">View</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
