import type { PlanName } from '@/lib/types';

export function normalizePlan(plan: string | null | undefined): PlanName {
  return plan === 'lifetime' ? 'lifetime' : 'free';
}

export function planDisplayName(plan: string | null | undefined): string {
  return normalizePlan(plan) === 'lifetime' ? 'Lifetime' : 'Free';
}

/** Mobile app access is a store-level Lifetime entitlement. */
export function hasMobileAppAccess(plan: string | null | undefined): boolean {
  return normalizePlan(plan) === 'lifetime';
}
