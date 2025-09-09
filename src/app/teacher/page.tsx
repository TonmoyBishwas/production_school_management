'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';

interface TeacherStats {
  classesToday: number;
  studentsTotal: number;
  attendanceMarked: number;
  pendingAttendance: number;
}

interface CurrentClass {
  id: string;
  grade: number;
  section: string;
  subject: string;
  startTime: string;
  endTime: string;
  period: number;
  canMarkAttendance: boolean;
  attendanceStatus: 'not_started' | 'in_progress' | 'completed' | 'expired';
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<TeacherStats>({
    classesToday: 0,
    studentsTotal: 0,
    attendanceMarked: 0,
    pendingAttendance: 0
  });
  const [currentClass, setCurrentClass] = useState<CurrentClass | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetchDashboardData();
    
    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    // Check for current class when time updates
    updateCurrentClass();
  }, [currentTime, todaySchedule]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teacher/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setTodaySchedule(data.schedule || []);
        setCurrentClass(data.currentClass || null);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentClass = () => {
    if (todaySchedule.length === 0) return;

    const now = currentTime;
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const activeClass = todaySchedule.find(schedule => {
      const startTime = schedule.startTime;
      const endTime = schedule.endTime;
      
      // Add 5 minutes grace period after class ends
      const endWithGrace = addMinutesToTime(endTime, 5);
      
      return currentTimeStr >= startTime && currentTimeStr <= endWithGrace;
    });

    if (activeClass) {
      const endWithGrace = addMinutesToTime(activeClass.endTime, 5);
      const canMarkAttendance = currentTimeStr >= activeClass.startTime && currentTimeStr <= endWithGrace;
      
      setCurrentClass({
        ...activeClass,
        canMarkAttendance,
        attendanceStatus: canMarkAttendance ? 'in_progress' : 'expired'
      });
    } else {
      setCurrentClass(null);
    }
  };

  const addMinutesToTime = (timeStr: string, minutes: number): string => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleMarkAttendance = () => {
    if (currentClass) {
      window.location.href = `/teacher/attendance/mark?classId=${currentClass.id}`;
    }
  };

  const scheduleColumns = [
    { key: 'period', label: 'Period' },
    { key: 'time', label: 'Time' },
    { key: 'subject', label: 'Subject' },
    { key: 'class', label: 'Class' },
    { key: 'status', label: 'Attendance Status' }
  ];

  const formattedSchedule = todaySchedule.map(schedule => ({
    period: `Period ${schedule.period}`,
    time: `${schedule.startTime} - ${schedule.endTime}`,
    subject: schedule.subject,
    class: `Grade ${schedule.grade} ${schedule.section}`,
    status: schedule.attendanceMarked ? '✅ Completed' : '⏳ Pending'
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} navItems={navItems} />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Current Time: {currentTime.toLocaleTimeString()} | 
            {currentTime.toDateString()}
          </p>
        </div>

        {/* Current Class Alert */}
        {currentClass && (
          <div className="mb-6">
            <Card testId="current-class-alert">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Current Class</h3>
                  <p className="text-gray-600">
                    Grade {currentClass.grade} {currentClass.section} - {currentClass.subject}
                  </p>
                  <p className="text-sm text-gray-500">
                    {currentClass.startTime} - {currentClass.endTime} (Period {currentClass.period})
                  </p>
                </div>
                <div className="flex space-x-3">
                  {currentClass.canMarkAttendance ? (
                    <Button
                      onClick={handleMarkAttendance}
                      testId="mark-attendance-btn"
                      className="bg-success hover:bg-green-700"
                    >
                      Mark Attendance
                    </Button>
                  ) : (
                    <div className="text-error text-sm">
                      {currentClass.attendanceStatus === 'expired' ? 'Time Expired' : 'Not Available'}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card testId="stats-classes">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary" data-testid="classes-today">
                {stats.classesToday}
              </div>
              <div className="text-sm text-gray-600 mt-1">Classes Today</div>
            </div>
          </Card>

          <Card testId="stats-students">
            <div className="text-center">
              <div className="text-3xl font-bold text-success" data-testid="total-students">
                {stats.studentsTotal}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Students</div>
            </div>
          </Card>

          <Card testId="stats-marked">
            <div className="text-center">
              <div className="text-3xl font-bold text-success" data-testid="attendance-marked">
                {stats.attendanceMarked}
              </div>
              <div className="text-sm text-gray-600 mt-1">Attendance Marked</div>
            </div>
          </Card>

          <Card testId="stats-pending">
            <div className="text-center">
              <div className="text-3xl font-bold text-warning" data-testid="pending-attendance">
                {stats.pendingAttendance}
              </div>
              <div className="text-sm text-gray-600 mt-1">Pending Classes</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <Card title="Today's Schedule" testId="schedule-card">
            <Table
              columns={scheduleColumns}
              data={formattedSchedule}
              testId="schedule-table"
            />
            
            {formattedSchedule.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500">No classes scheduled for today</div>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions" testId="quick-actions-card">
            <div className="space-y-4">
              <Button
                onClick={() => window.location.href = '/teacher/attendance'}
                testId="view-attendance-btn"
                className="w-full text-left justify-start"
                variant="secondary"
              >
                📋 View All Attendance Records
              </Button>
              
              <Button
                onClick={() => window.location.href = '/teacher/homework'}
                testId="assign-homework-btn"
                className="w-full text-left justify-start"
                variant="secondary"
              >
                📚 Assign Homework
              </Button>
              
              <Button
                onClick={() => window.location.href = '/teacher/grades'}
                testId="grade-exams-btn"
                className="w-full text-left justify-start"
                variant="secondary"
              >
                📝 Grade Exams
              </Button>
              
              <Button
                onClick={() => window.location.href = '/teacher/schedule'}
                testId="view-full-schedule-btn"
                className="w-full text-left justify-start"
                variant="secondary"
              >
                📅 View Full Schedule
              </Button>
            </div>
          </Card>
        </div>

        {/* Time Restriction Notice */}
        <div className="mt-8">
          <Card testId="notice-card">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h4 className="font-medium text-yellow-800 mb-2">⏰ Attendance Marking Rules</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• You can only mark attendance during your assigned class period</li>
                <li>• Grace period: 5 minutes after class ends</li>
                <li>• Late attendance marking will be automatically disabled</li>
                <li>• Contact admin if you need to mark attendance for a missed period</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}