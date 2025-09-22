// Row Level Security Helper Functions
// This ensures all database queries respect multi-tenancy

import { prisma } from './db';

export interface SecurityContext {
  schoolId: string;
  userRole: string;
  userId: string;
}

/**
 * Sets the security context for RLS policies
 * Must be called before any database operations
 */
export async function setSecurityContext(context: SecurityContext) {
  await prisma.$executeRaw`SELECT set_config('app.current_school_id', ${context.schoolId}, true)`;
  await prisma.$executeRaw`SELECT set_config('app.current_user_role', ${context.userRole}, true)`;
  await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${context.userId}, true)`;
}

/**
 * Clears the security context
 */
export async function clearSecurityContext() {
  await prisma.$executeRaw`SELECT set_config('app.current_school_id', '', true)`;
  await prisma.$executeRaw`SELECT set_config('app.current_user_role', '', true)`;
  await prisma.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;
}

/**
 * Wrapper function that ensures security context is set for database operations
 */
export async function withSecurityContext<T>(
  context: SecurityContext,
  operation: () => Promise<T>
): Promise<T> {
  try {
    await setSecurityContext(context);
    const result = await operation();
    return result;
  } finally {
    await clearSecurityContext();
  }
}

/**
 * Middleware helper to extract security context from request headers
 */
export function extractSecurityContext(headers: Headers): SecurityContext {
  const schoolId = headers.get('x-school-id');
  const userRole = headers.get('x-user-role');
  const userId = headers.get('x-user-id');

  if (!schoolId || !userRole || !userId) {
    throw new Error('Missing security context in request headers');
  }

  return { schoolId, userRole, userId };
}

/**
 * Validates that the user has permission to access a specific school
 */
export async function validateSchoolAccess(
  userId: string,
  schoolId: string
): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      schoolId: schoolId
    }
  });

  return !!user;
}

/**
 * Special context for superadmin operations
 */
export const SUPERADMIN_CONTEXT: SecurityContext = {
  schoolId: '',
  userRole: 'superadmin',
  userId: 'superadmin'
};

/**
 * Creates a school-specific context
 */
export function createSchoolContext(
  schoolId: string,
  userRole: string,
  userId: string
): SecurityContext {
  return { schoolId, userRole, userId };
}