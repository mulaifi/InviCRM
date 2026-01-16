export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  REP: 'rep',
} as const;

export const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 4,
  admin: 3,
  manager: 2,
  rep: 1,
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'users:read',
    'users:write',
    'users:delete',
    'contacts:read',
    'contacts:write',
    'contacts:delete',
    'deals:read',
    'deals:write',
    'deals:delete',
    'settings:read',
    'settings:write',
    'reports:read',
  ],
  manager: [
    'users:read',
    'contacts:read',
    'contacts:write',
    'deals:read',
    'deals:write',
    'reports:read',
  ],
  rep: [
    'contacts:read',
    'contacts:write',
    'deals:read',
    'deals:write',
  ],
};
