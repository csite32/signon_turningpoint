import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import * as usersService from "@/services/usersService";
import type { AdminUser } from "@/services/usersService";
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
  temporaryPassword: z.string().min(6, "לפחות 6 תווים"),
  role: z.enum(["admin", "editor"]),
});
type FormValues = z.infer<typeof schema>;

export function UserForm({ onCreated }: { onCreated: (user: AdminUser) => void }) {
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "editor" } });

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return;
    setBusy(true);
    const res = await usersService.createUser(values);
    setBusy(false);
    if (!res.ok) {
      toast.error(
        res.error === "duplicate_email"
          ? "כבר קיים משתמש עם אימייל זה"
          : res.error === "forbidden"
            ? "אין לך הרשאה להוסיף משתמשים"
            : res.error === "role_assign_failed"
              ? "המשתמש נוצר אך שיוך ההרשאה נכשל — נסו שוב"
              : "הוספת המשתמש נכשלה",
      );
      return;
    }
    toast.success("המשתמש נוסף");
    reset({ displayName: "", email: "", temporaryPassword: "", role: "editor" });
    onCreated(res.data);
  });

  return (
    <form
      dir="rtl"
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
    >
      <div className="space-y-1.5">
        <Label htmlFor="displayName">שם</Label>
        <Input id="displayName" {...register("displayName")} />
        {errors.displayName && (
          <p className="text-xs text-destructive">{errors.displayName.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">אימייל</Label>
        <Input id="email" dir="ltr" className="text-left" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="temporaryPassword">סיסמה</Label>
        <Input
          id="temporaryPassword"
          dir="ltr"
          className="text-left"
          type="text"
          {...register("temporaryPassword")}
        />
        {errors.temporaryPassword && (
          <p className="text-xs text-destructive">{errors.temporaryPassword.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>הרשאה</Label>
        <Select
          value={watch("role")}
          onValueChange={(v) => setValue("role", v as "admin" | "editor")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">admin</SelectItem>
            <SelectItem value="editor">editor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={busy} className="w-full gap-2">
        <UserPlus className="h-4 w-4" />
        {busy ? "מוסיף..." : "הוספת משתמש"}
      </Button>
    </form>
  );
}
