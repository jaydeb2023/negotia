// Safe to import from both server and browser code.
export const ROLES = {
  SUPER: 'super_admin',
  COMPANY: 'company_admin',
  EMPLOYEE: 'employee',
  INDIVIDUAL: 'individual',
};

export const ROLE_LABEL = {
  super_admin: 'Super admin',
  company_admin: 'Company admin',
  employee: 'Employee',
  individual: 'Individual',
};

// Where each role lands after signing in.
export function homeFor(role) {
  if (role === ROLES.SUPER) return '/super';
  if (role === ROLES.COMPANY) return '/company';
  return '/app';
}

export const isCompanyRole = (role) => role === ROLES.COMPANY || role === ROLES.EMPLOYEE;
