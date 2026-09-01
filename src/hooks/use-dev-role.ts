import { useEffect, useState } from "react";
import type { MockRole } from "@/types/user";
import {
  getDevRole,
  setDevRole,
  onDevRoleChange,
  isDevRoleSwitchAvailable,
} from "@/lib/dashboard/dev-role-switch";

export function useDevRole(): {
  role: MockRole;
  setRole: (role: MockRole) => void;
  available: boolean;
} {
  const [role, setRoleState] = useState<MockRole>("admin");

  useEffect(() => {
    setRoleState(getDevRole());
    return onDevRoleChange(() => setRoleState(getDevRole()));
  }, []);

  return {
    role,
    setRole: setDevRole,
    available: isDevRoleSwitchAvailable(),
  };
}
