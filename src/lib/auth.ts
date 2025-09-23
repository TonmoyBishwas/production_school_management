import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  role: string;
  schoolId: string;
  username: string;
}

export function generateToken(userId: string, role: string, schoolId: string, username: string): string {
  return jwt.sign(
    { userId, role, schoolId, username },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  );
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
}

export function verifyTokenEdge(token: string): JWTPayload {
  // Edge-compatible version using Web Crypto API
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Edge Runtime compatible versions
export async function hashPasswordEdge(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + process.env.JWT_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function comparePasswordEdge(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPasswordEdge(password);
  return hashedInput === hashedPassword;
}

// Role permissions
export const ROLE_PERMISSIONS = {
  superadmin: ['/api/schools', '/superadmin'],
  admin: ['/api/students', '/api/teachers', '/api/subjects', '/api/schedules', '/admin'],
  teacher: ['/api/attendance', '/api/homework', '/api/grades', '/teacher'],
  student: ['/api/student-data', '/student'],
  parent: ['/api/parent-data', '/parent'],
  accountant: ['/api/payments', '/api/finances', '/accountant']
};

export function hasPermission(role: string, path: string): boolean {
  const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
  return permissions ? permissions.some(permission => path.startsWith(permission)) : false;
}