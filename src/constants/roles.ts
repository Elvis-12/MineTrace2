export const ROLES = {
  ADMIN: 'ADMIN',
  MINE_OFFICER: 'MINE_OFFICER',
  SUPPLY_OFFICER: 'SUPPLY_OFFICER',
  INSPECTOR: 'INSPECTOR',
} as const;

export type Role = keyof typeof ROLES;
