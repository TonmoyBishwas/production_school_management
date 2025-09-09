'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface Student {
  id: string;
  studentId: string;
  name: string;
  rollNumber?: number;
}

interface ClassInfo {
  id: string;
  grade: number;
  section: string;
  subject: string;
  period: number;
  startTime: string;
  endTime: string;
  canMarkAttendance: boolean;
  timeRemaining: number;
}

function MarkAttendanceContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');
  
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const navItems = [
    { label: 'Dashboard', href: '/teacher', testId: 'nav-dashboard' },
    { label: 'Attendance', href: '/teacher/attendance', testId: 'nav-attendance' },
    { label: 'Homework', href: '/teacher/homework', testId: 'nav-homework' },
    { label: 'Grades', href: '/teacher/grades', testId: 'nav-grades' },
    { label: 'Schedule', href: '/teacher/schedule', testId: 'nav-schedule' }
  ];

  const user = {
    username: 'Teacher',
    role: 'teacher'
  };

  useEffect(() => {
    if (classId) {
      fetchClassData();
    }
    
    // Update time every second to show remaining time
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [classId]);

  useEffect(() => {
    updateTimeRemaining();
  }, [currentTime, classInfo]);

  const fetchClassData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teacher/attendance/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setClassInfo(data.classInfo);
        setStudents(data.students);
        
        // Initialize attendance state
        const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
        data.students.forEach((student: Student) => {
          initialAttendance[student.id] = 'present'; // Default to present
        });
        setAttendance(initialAttendance);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch class data');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateTimeRemaining = () => {
    if (!classInfo) return;

    const now = currentTime;
    const [endHours, endMinutes] = classInfo.endTime.split(':').map(Number);
    const endTime = new Date(now);
    endTime.setHours(endHours, endMinutes + 5, 0, 0); // 5 minutes grace

    const timeRemaining = Math.max(0, endTime.getTime() - now.getTime());
    
    setClassInfo(prev => prev ? {
      ...prev,
      timeRemaining,
      canMarkAttendance: timeRemaining > 0
    } : null);
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return 'Time Expired';
    
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
  };

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async () => {
    if (!classInfo || !classInfo.canMarkAttendance) {
      setError('Cannot mark attendance - time has expired');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          classId,
          attendance
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Attendance marked successfully!');
        setTimeout(() => {
          window.location.href = '/teacher';
        }, 2000);
      } else {
        setError(data.message || 'Failed to mark attendance');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickMarkAll = (status: 'present' | 'absent') => {
    const newAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
    students.forEach(student => {
      newAttendance[student.id] = status;
    });
    setAttendance(newAttendance);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} navItems={navItems} />
        <div className="max-w-2xl mx-auto py-12 px-4">
          <Card testId="error-card">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-error mb-4">Class Not Found</h2>
              <p className="text-gray-600 mb-6">The requested class could not be found.</p>
              <Button
                onClick={() => window.location.href = '/teacher'}
                testId="back-to-dashboard-btn"
              >
                Back to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} navItems={navItems} />
      
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="text-gray-600 mt-2">
            Grade {classInfo.grade} {classInfo.section} - {classInfo.subject} (Period {classInfo.period})
          </p>
        </div>

        {/* Time Status */}
        <div className="mb-6">
          <Card testId="time-status-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Class Time: {classInfo.startTime} - {classInfo.endTime}
                </h3>
                <p className="text-gray-600">Current Time: {currentTime.toLocaleTimeString()}</p>
              </div>
              <div className="text-right">
                {classInfo.canMarkAttendance ? (
                  <div className="text-success font-medium" data-testid="time-remaining">
                    ⏰ {formatTimeRemaining(classInfo.timeRemaining)}
                  </div>
                ) : (
                  <div className="text-error font-medium" data-testid="time-expired">
                    ❌ Time Expired
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" data-testid="error-message">
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded" data-testid="success-message">
              {success}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {classInfo.canMarkAttendance && (
          <div className="mb-6">
            <Card title="Quick Actions" testId="quick-actions-card">
              <div className="flex space-x-4">
                <Button
                  onClick={() => handleQuickMarkAll('present')}
                  testId="mark-all-present-btn"
                  className="bg-success hover:bg-green-700"
                >
                  Mark All Present
                </Button>
                <Button
                  onClick={() => handleQuickMarkAll('absent')}
                  testId="mark-all-absent-btn"
                  variant="danger"
                >
                  Mark All Absent
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Students List */}
        <Card title={`Students (${students.length})`} testId="students-card">
          <div className="space-y-4">
            {students.map((student, index) => (
              <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {['present', 'absent', 'late'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleAttendanceChange(student.id, status as any)}
                      disabled={!classInfo.canMarkAttendance}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        attendance[student.id] === status
                          ? status === 'present'
                            ? 'bg-success text-white'
                            : status === 'absent'
                            ? 'bg-error text-white'
                            : 'bg-warning text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${!classInfo.canMarkAttendance ? 'opacity-50 cursor-not-allowed' : ''}`}
                      data-testid={`attendance-${student.id}-${status}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex space-x-4">
            <Button
              onClick={() => window.location.href = '/teacher'}
              variant="secondary"
              testId="cancel-btn"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={saving}
              disabled={!classInfo.canMarkAttendance}
              testId="save-attendance-btn"
              className="flex-1"
            >
              Save Attendance
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function MarkAttendancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <MarkAttendanceContent />
    </Suspense>
  );
}