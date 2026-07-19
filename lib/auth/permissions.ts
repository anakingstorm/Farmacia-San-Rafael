import type { Session } from 'next-auth';

export function getAdminOwnerEmail(): string {
  return process.env.ADMIN_OWNER_EMAIL || process.env.SEED_ADMIN_EMAIL || 'anakingstorm@gmail.com';
}

export function isAdminOwnerEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  return email.toLowerCase() === getAdminOwnerEmail().toLowerCase();
}

export function isAdminOwnerSession(session: Session | null | undefined): boolean {
  return isAdminOwnerEmail(session?.user?.email);
}
