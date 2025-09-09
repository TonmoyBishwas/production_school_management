'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';

interface StudentStats {
  attendancePercentage: number;
  totalClasses: number;
  classesAttended: number;
  homeworkAssigned: number;
  homeworkCompleted: number;
  averageGrade: number;
}

interface StudentInfo {
  id: string;
  studentId: string;
  name: string;
  grade: number;
  section: string;
  bloodGroup: string;
  parentName: string;
  parentPhone: string;
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<StudentStats>({
    attendancePercentage: 0,
    totalClasses: 0,
    classesAttended: 0,
    homeworkAssigned: 0,
    homeworkCompleted: 0,
    averageGrade: 0
  });
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [upcomingHomework, setUpcomingHomework] = useState([]);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { label: 'Dashboard', href: '/student', testId: 'nav-dashboard' },
    { label: 'Attendance', href: '/student/attendance', testId: 'nav-attendance' },
    { label: 'Homework', href: '/student/homework', testId: 'nav-homework' },
    { label: 'Grades', href: '/student/grades', testId: 'nav-grades' },
    { label: 'Schedule', href: '/student/schedule', testId: 'nav-schedule' },
    { label: 'Calendar', href: '/student/calendar', testId: 'nav-calendar' }
  ];

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setStudentInfo(data.studentInfo || null);
        setRecentAttendance(data.recentAttendance || []);
        setUpcomingHomework(data.upcomingHomework || []);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const user = {
    username: studentInfo?.name || 'Student',
    role: 'student'
  };

  const attendanceColumns = [
    { key: 'date', label: 'Date' },
    { key: 'subject', label: 'Subject' },
    { key: 'period', label: 'Period' },
    { key: 'status', label: 'Status' }
  ];

  const homeworkColumns = [
    { key: 'subject', label: 'Subject' },
    { key: 'title', label: 'Assignment' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'status', label: 'Status' }
  ];

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 75) return 'text-warning';
    return 'text-error';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-success';
    if (grade >= 75) return 'text-warning';
    return 'text-error';
  };

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
        {/* Header with Student Info */}
        <div className="mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome, {studentInfo?.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  Student ID: {studentInfo?.studentId} | 
                  Grade {studentInfo?.grade} {studentInfo?.section} | 
                  Blood Group: {studentInfo?.bloodGroup}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Parent Contact</p>
                <p className="font-medium">{studentInfo?.parentName}</p>
                <p className="text-sm text-gray-600">{studentInfo?.parentPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card testId="attendance-card">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getAttendanceColor(stats.attendancePercentage)}`} data-testid="attendance-percentage">
                {stats.attendancePercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Attendance</div>
              <div className="text-xs text-gray-500 mt-2">
                {stats.classesAttended} / {stats.totalClasses} classes
              </div>
            </div>
          </Card>

          <Card testId="homework-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary" data-testid="homework-completion">
                {stats.homeworkAssigned > 0 
                  ? ((stats.homeworkCompleted / stats.homeworkAssigned) * 100).toFixed(1)
                  : 0
                }%
              </div>
              <div className="text-sm text-gray-600 mt-1">Homework Completion</div>
              <div className="text-xs text-gray-500 mt-2">
                {stats.homeworkCompleted} / {stats.homeworkAssigned} assignments
              </div>
            </div>
          </Card>

          <Card testId="grades-card">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getGradeColor(stats.averageGrade)}`} data-testid="average-grade">
                {stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Average Grade</div>
              <div className="text-xs text-gray-500 mt-2">
                Overall Performance
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Attendance */}
          <Card title="Recent Attendance" testId="recent-attendance-card">
            <Table
              columns={attendanceColumns}
              data={recentAttendance}
              testId="recent-attendance-table"
            />
            
            <div className="mt-4 text-center">
              <Button
                onClick={() => window.location.href = '/student/attendance'}
                variant="secondary"
                testId="view-all-attendance-btn"
              >
                View Full Attendance
              </Button>
            </div>
          </Card>

          {/* Upcoming Homework */}
          <Card title="Upcoming Homework" testId="homework-card">
            <Table
              columns={homeworkColumns}
              data={upcomingHomework}
              testId="upcoming-homework-table"
            />
            
            <div className="mt-4 text-center">
              <Button
                onClick={() => window.location.href = '/student/homework'}
                variant="secondary"
                testId="view-all-homework-btn"
              >
                View All Homework
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <Card title="Quick Links" testId="quick-links-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => window.location.href = '/student/schedule'}
                testId="view-schedule-btn"
                variant="secondary"
                className="h-20 flex flex-col items-center justify-center"
              >
                <div className="text-2xl mb-1">📅</div>
                <div className="text-sm">Class Schedule</div>
              </Button>
              
              <Button
                onClick={() => window.location.href = '/student/grades'}
                testId="view-grades-btn"
                variant="secondary"
                className="h-20 flex flex-col items-center justify-center"
              >
                <div className="text-2xl mb-1">📊</div>
                <div className="text-sm">Grades & Results</div>
              </Button>
              
              <Button
                onClick={() => window.location.href = '/student/calendar'}
                testId="view-calendar-btn"
                variant="secondary"
                className="h-20 flex flex-col items-center justify-center"
              >
                <div className="text-2xl mb-1">📆</div>
                <div className="text-sm">Academic Calendar</div>
              </Button>
              
              <Button
                onClick={() => window.location.href = '/student/reports'}
                testId="view-reports-btn"
                variant="secondary"
                className="h-20 flex flex-col items-center justify-center"
              >
                <div className="text-2xl mb-1">📋</div>
                <div className="text-sm">Reports</div>
              </Button>
            </div>
          </Card>
        </div>

        {/* Performance Alert */}
        {stats.attendancePercentage < 75 && (
          <div className="mt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="text-red-400 text-xl">⚠️</div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Low Attendance Warning
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Your attendance is below the required minimum of 75%. 
                      Please attend classes regularly to avoid academic issues.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}