import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hashedPassword: string): boolean {
  return bcrypt.compareSync(password, hashedPassword);
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

export function generateSecurePassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%";
  let password = "";
  
  // Ensure at least one character from each category
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Uppercase
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Lowercase
  password += "0123456789"[Math.floor(Math.random() * 10)]; // Number
  password += "@#$%"[Math.floor(Math.random() * 4)]; // Special
  
  // Fill remaining length
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
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