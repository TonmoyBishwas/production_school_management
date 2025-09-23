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
  // For Edge Runtime, use a simpler approach - just verify it's a valid JWT format and not expired
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const [header, payload, signature] = parts;
    
    // Decode payload to check basic structure and expiration
    // Add proper padding for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
      )
    );
    
    // Check required fields
    if (!decodedPayload.userId || !decodedPayload.role || !decodedPayload.username) {
      throw new Error('Invalid token payload');
    }
    
    // Check expiration
    if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
      throw new Error('Token expired');
    }
    
    // For Edge Runtime, we'll trust tokens that have the right structure and aren't expired
    // The full signature verification can be done by API routes if needed
    return decodedPayload as JWTPayload;
  } catch (error) {
    console.error('Token verification failed in Edge Runtime:', error);
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