import { format, parseISO } from 'date-fns';

export function formatDate(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'dd/MM/yyyy');
}

export function formatTime(time: string): string {
  return time; // Time is already in HH:MM format
}

export function formatDateTime(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'dd/MM/yyyy HH:mm');
}

export function generateStudentId(grade: number, schoolId: string): string {
  const year = new Date().getFullYear();
  const gradeStr = grade.toString().padStart(2, '0');
  // This will need to be replaced with actual sequence from database
  const sequence = Math.floor(Math.random() * 999) + 1;
  return `${year}-${gradeStr}-${sequence.toString().padStart(3, '0')}`;
}

export function generateTeacherId(schoolId: string): string {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 999) + 1;
  return `T${year}${sequence.toString().padStart(3, '0')}`;
}

export function createStudentFolderName(
  firstName: string,
  age: number,
  grade: number,
  section: string,
  bloodGroup: string,
  admitDate: string,
  studentId: string,
  parentPhone: string
): string {
  const formattedAdmitDate = formatDate(admitDate).replace(/\//g, '-');
  return `student@${firstName}@${age}@${grade}@${section}@${bloodGroup}@${formattedAdmitDate}@${studentId}@${parentPhone}`;
}

export function createTeacherFolderName(
  firstName: string,
  age: number,
  bloodGroup: string,
  joinDate: string,
  teacherId: string,
  subject: string,
  email: string
): string {
  const formattedJoinDate = formatDate(joinDate).replace(/\//g, '-');
  return `teacher@${firstName}@${age}@${bloodGroup}@${formattedJoinDate}@${teacherId}@${subject}@${email}`;
}

export function validatePhotoUpload(files: File[]): { valid: boolean; message?: string } {
  if (files.length < 5) {
    return { valid: false, message: 'Minimum 5 photos required' };
  }
  if (files.length > 20) {
    return { valid: false, message: 'Maximum 20 photos allowed' };
  }
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, message: 'Only JPG and PNG files allowed' };
    }
    if (file.size > maxSize) {
      return { valid: false, message: 'File size must be less than 5MB' };
    }
  }
  
  return { valid: true };
}

export function isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
  const current = new Date(`2000-01-01T${currentTime}`);
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  return current >= start && current <= end;
}

export function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 5); // HH:MM format
}