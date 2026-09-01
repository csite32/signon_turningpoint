import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Users as UsersIcon } from "lucide-react";
import * as usersService from "@/services/usersService";
import type { AdminUser, AdminRole } from "@/services/usersService";
import { useRoleAccess } from "@/hooks/use-role";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { UserForm } from "@/components/admin/UserForm";

export function UserTable() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const access = useRoleAccess();
  const currentUserId = access.status === "authorized" ? access.userId : null;

  async function load() {
    setError(null);
    const res = await usersService.getUsers({ search });
    if (!res.ok) {
      setError(res.error);
      setUsers([]);
      return;
    }
    setUsers(res.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function roleErrorMessage(code: string): string {
    switch (code) {
      case "cannot_demote_self":
        return "לא ניתן להוריד את ההרשאה של עצמך מ-admin";
      case "last_admin":
        return "חייב להישאר לפחות מנהל אחד במערכת";
      case "forbidden":
        return "אין לך הרשאה לשנות תפקידים";
      default:
        return "עדכון ההרשאה נכשל";
    }
  }

  async function handleRoleChange(user: AdminUser, role: AdminRole) {
    if (pendingId || user.role === role) return;
    setPendingId(user.id);
    const res = await usersService.updateUserRole(user.id, role);
    setPendingId(null);
    if (!res.ok) {
      toast.error(roleErrorMessage(res.error));
      return;
    }
    toast.success("ההרשאה עודכנה");
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await usersService.deleteUser(deleteTarget.id);
    setDeleting(false);
    if (!res.ok) {
      toast.error(
        res.error === "cannot_delete_self"
          ? "לא ניתן למחוק את המשתמש שלך"
          : res.error === "last_admin"
            ? "לא ניתן למחוק את המנהל האחרון"
            : res.error === "forbidden"
              ? "אין לך הרשאה למחוק משתמשים"
              : "מחיקת המשתמש נכשלה",
      );
      return;
    }
    toast.success("המשתמש נמחק");
    setDeleteTarget(null);
    load();
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center gap-2">
        <UsersIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">משתמשים</h1>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <h2 className="text-sm font-medium text-muted-foreground">הוספת משתמש</h2>
        </CardHeader>
        <CardContent className="pt-6">
          <UserForm onCreated={load} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <Input
            placeholder="חיפוש לפי שם או אימייל..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
        </CardHeader>
        <CardContent className="pt-6">
          {error && <p className="text-sm text-destructive">שגיאה בטעינת המשתמשים: {error}</p>}

          {users === null ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : users.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              אין משתמשים תואמים לחיפוש.
            </p>
          ) : (
            <div className="-mx-6 overflow-x-auto px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם</TableHead>
                    <TableHead>אימייל</TableHead>
                    <TableHead>הרשאה</TableHead>
                    <TableHead>נוצר בתאריך</TableHead>
                    <TableHead className="text-left">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const isSelf = u.id === currentUserId;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {u.displayName}
                            {isSelf && <Badge variant="secondary">את/ה</Badge>}
                          </div>
                        </TableCell>
                        <TableCell dir="ltr" className="text-right text-sm text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role ?? undefined}
                            onValueChange={(v) => handleRoleChange(u, v as AdminRole)}
                            disabled={pendingId === u.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="ללא הרשאה" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">admin</SelectItem>
                              <SelectItem value="editor">editor</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString("he-IL")}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1.5"
                              disabled={isSelf}
                              onClick={() => setDeleteTarget(u)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              מחיקה
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="מחיקת משתמש"
        description={`האם למחוק את המשתמש "${deleteTarget?.displayName ?? ""}"? הפעולה אינה הפיכה.`}
        busy={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
