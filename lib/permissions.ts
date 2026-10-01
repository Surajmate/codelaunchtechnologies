import { UserRole } from "@/types/auth";

export function isAdmin(role: UserRole) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdmin(role: UserRole) {
  return role === "SUPER_ADMIN";
}