import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as usersService from "@/services/usersService";
import type { AdminUser, AdminRole, UpdateUserInput } from "@/services/usersService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  displayName: z.string().min(1, "שם נדרש"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  role: z.enum(["admin", "editor"]),
  // Optional: empty means "keep the current password".
  newPassword: z.string().refine((v) => v === "" || v.length >= 6, "לפחות 6 תווים"),
});
type FormValues = z.infer<typeof schema>;

function editErrorMessage(code: string): string {
  switch (code) {
    case "duplicate_email":
      return "כבר קיים משתמש עם אימייל זה";
    case "cannot_demote_self":
      return "לא ניתן לשנות את התפקיד של עצמך";
    case "last_admin":
      return "חייב להישאר לפחות מנהל אחד במערכת";
    case "not_found":
      return "המשתמש לא נמצא — ייתכן שנמחק";
    case "forbidden":
      return "אין לך הרשאה לערוך משתמשים";
    case "rollback_failed":
    case "inconsistent_state":
      return "העדכון נכשל ולא ניתן היה לשחזר את המצב — בדקו את המשתמש ידנית";
    default:
      return "עדכון המשתמש נכשל";
  }
}

/**
 * Edit an existing user. Server-side (updateUserServerFn) re-checks the caller
 * is admin, guards self-demote / last-admin, and rolls the role change back if
 * the Auth update then fails. This dialog only ever sends the fields that
 * actually changed; an empty "new password" is never sent and never touches
 * the existing password.
 */
export function UserEditDialog({
  open,
  onOpenChange,
  user,
  currentUserId,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  currentUserId: string | null;
  onUpdated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", role: "editor", newPassword: "" },
  });

  const isSelf = !!user && user.id === currentUserId;

  useEffect(() => {
    if (open && user) {
      reset({
        displayName: user.displayName,
        email: user.email,
        role: user.role ?? "editor",
        newPassword: "",
      });
    }
  }, [open, user, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!user || busy) return;

    const patch: UpdateUserInput = { userId: user.id };
    if (values.displayName !== user.displayName) patch.displayName = values.displayName;
    if (values.email !== user.email) patch.email = values.email;
    if (!isSelf && values.role !== (user.role ?? null)) patch.role = values.role as AdminRole;
    if (values.newPassword.trim()) patch.newPassword = values.newPassword;

    const changedKeys = Object.keys(patch).filter((k) => k !== "userId");
    if (changedKeys.length === 0) {
      toast.info("לא בוצעו שינויים");
      onOpenChange(false);
      return;
    }

    setBusy(true);
    const res = await usersService.updateUser(patch);
    setBusy(false);
    if (!res.ok) {
      toast.error(editErrorMessage(res.error));
      return;
    }
    toast.success("המשתמש עודכן");
    onUpdated();
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>עריכת משתמש</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-displayName">שם</Label>
            <Input id="edit-displayName" {...register("displayName")} />
            {formState.errors.displayName && (
              <p className="text-xs text-destructive">{formState.errors.displayName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-email">אימייל</Label>
            <Input id="edit-email" dir="ltr" className="text-left" {...register("email")} />
            {formState.errors.email && (
              <p className="text-xs text-destructive">{formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>הרשאה</Label>
            <Select
              value={watch("role")}
              onValueChange={(v) => setValue("role", v as AdminRole)}
              disabled={isSelf}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="editor">editor</SelectItem>
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-xs text-muted-foreground">לא ניתן לשנות את התפקיד של עצמך.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-newPassword">סיסמה חדשה</Label>
            <Input
              id="edit-newPassword"
              dir="ltr"
              className="text-left"
              type="password"
              autoComplete="new-password"
              {...register("newPassword")}
            />
            <p className="text-xs text-muted-foreground">השאירו ריק כדי לשמור על הסיסמה הקיימת.</p>
            {formState.errors.newPassword && (
              <p className="text-xs text-destructive">{formState.errors.newPassword.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "שומר..." : "שמירה"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
