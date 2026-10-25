export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: string;
  userCount: number;
  activeUserCount: number;
  /** Only on the detail endpoint. */
  lastActivityAt: string | null;
}

export interface TenantUser {
  userId: string;
  fullName: string;
  email: string;
  profile: string;
  /** Membership and account both active: can be impersonated. */
  active: boolean;
  lastLoginAt: string | null;
  joinedAt: string;
}

export interface AuditEvent {
  id: string;
  occurredAt: string;
  category: string;
  action: string;
  actorType: string;
  actorId: string;
  actorName: string;
  portalId: string | null;
  targetUserId: string | null;
  targetName: string | null;
  detail: string | null;
}

export interface ImpersonationRequest {
  portalId: string;
  targetUserId: string;
  durationMinutes: number;
  reason: string;
  comment: string;
  acknowledged: boolean;
}

export interface ImpersonationStart {
  id: string;
  launchUrl: string;
  launchExpiresAt: string;
  expiresAt: string;
}
