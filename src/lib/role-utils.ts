// Platform-level roles that are NEVER subject to plan limits
// These users manage the platform itself and should never be frozen or blocked
export const PLATFORM_ROLES = ['CEO', 'ADMIN', 'PLATFORM_MANAGER'] as const;

// Roles excluded from agency user counts (not counted against plan limits)
export const EXCLUDED_FROM_USER_COUNT = ['CEO', 'ADMIN', 'PLATFORM_MANAGER', 'AGENCY_ADMIN'] as const;

// Check if a role is a platform role (exempt from plan limits)
export const isPlatformRole = (role: string): boolean => {
  return PLATFORM_ROLES.includes(role as typeof PLATFORM_ROLES[number]);
};

// Check if a role should be excluded from user counts
export const isExcludedFromUserCount = (role: string): boolean => {
  return EXCLUDED_FROM_USER_COUNT.includes(role as typeof EXCLUDED_FROM_USER_COUNT[number]);
};

// Role label translations (English to Portuguese)
export const roleLabels: Record<string, string> = {
  CEO: 'CEO',
  ADMIN: 'Administrador',
  AGENCY_ADMIN: 'Diretor de Agência',
  AGENCY_MANAGER: 'Gerente de Agência',
  BROKER: 'Corretor',
  INDEPENDENT_OWNER: 'Proprietário Independente',
  PROPRIETARIO: 'Proprietário',
  INQUILINO: 'Inquilino',
  BUILDING_MANAGER: 'Síndico',
  LEGAL_AUDITOR: 'Auditor Legal',
  REPRESENTATIVE: 'Representante',
  PLATFORM_MANAGER: 'Gerente de Plataforma',
  API_CLIENT: 'Cliente API',
};

export const getRoleLabel = (role: string): string => {
  return roleLabels[role] || role;
};

// Role colors for badges
export const roleColors: Record<string, string> = {
  CEO: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
  AGENCY_ADMIN: 'bg-orange-100 text-orange-800',
  AGENCY_MANAGER: 'bg-indigo-100 text-indigo-800',
  BROKER: 'bg-yellow-100 text-yellow-800',
  INDEPENDENT_OWNER: 'bg-green-100 text-green-800',
  PROPRIETARIO: 'bg-green-100 text-green-800',
  INQUILINO: 'bg-blue-100 text-blue-800',
  BUILDING_MANAGER: 'bg-teal-100 text-teal-800',
  LEGAL_AUDITOR: 'bg-gray-100 text-gray-800',
  REPRESENTATIVE: 'bg-pink-100 text-pink-800',
  PLATFORM_MANAGER: 'bg-cyan-100 text-cyan-800',
  API_CLIENT: 'bg-slate-100 text-slate-800',
};

export const getRoleColor = (role: string): string => {
  return roleColors[role] || 'bg-gray-100 text-gray-800';
};
