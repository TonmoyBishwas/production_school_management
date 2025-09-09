'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  presentToday: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    presentToday: 0
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { label: 'Dashboard', href: '/admin', testId: 'nav-dashboard' },
    { label: 'Students', href: '/admin/students', testId: 'nav-students' },
    { label: 'Teachers', href: '/admin/teachers', testId: 'nav-teachers' },
    { label: 'Subjects', href: '/admin/subjects', testId: 'nav-subjects' },
    { label: 'Schedule', href: '/admin/schedule', testId: 'nav-schedule' },
    { label: 'Calendar', href: '/admin/calendar', testId: 'nav-calendar' }
  ];

  const user = {
    username: 'School Admin',
    role: 'admin'
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setRecentStudents(data.recentStudents || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Register Student',
      description: 'Add a new student with photos',
      href: '/admin/students/new',
      testId: 'quick-register-student',
      color: 'bg-primary'
    },
    {
      title: 'Register Teacher',
      description: 'Add a new teacher',
      href: '/admin/teachers/new',
      testId: 'quick-register-teacher',
      color: 'bg-success'
    },
    {
      title: 'Create Schedule',
      description: 'Manage class timetables',
      href: '/admin/schedule/new',
      testId: 'quick-create-schedule',
      color: 'bg-warning'
    },
    {
      title: 'Add Calendar Event',
      description: 'Holidays, exams, meetings',
      href: '/admin/calendar/new',
      testId: 'quick-add-event',
      color: 'bg-secondary'
    }
  ];

  const studentColumns = [
    { key: 'studentId', label: 'Student ID' },
    { key: 'name', label: 'Name' },
    { key: 'grade', label: 'Grade' },
    { key: 'section', label: 'Section' },
    { key: 'admissionDate', label: 'Admission Date' }
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">School Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage students, teachers, and school operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card testId="stats-students">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary" data-testid="total-students">
                {stats.totalStudents}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Students</div>
            </div>
          </Card>

          <Card testId="stats-teachers">
            <div className="text-center">
              <div className="text-3xl font-bold text-success" data-testid="total-teachers">
                {stats.totalTeachers}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Teachers</div>
            </div>
          </Card>

          <Card testId="stats-subjects">
            <div className="text-center">
              <div className="text-3xl font-bold text-warning" data-testid="total-subjects">
                {stats.totalSubjects}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Subjects</div>
            </div>
          </Card>

          <Card testId="stats-present">
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary" data-testid="present-today">
                {stats.presentToday}
              </div>
              <div className="text-sm text-gray-600 mt-1">Present Today</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card title="Quick Actions" testId="quick-actions-card">
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => window.location.href = action.href}
                  className={`${action.color} text-white p-4 rounded-lg text-left hover:opacity-90 transition-opacity`}
                  data-testid={action.testId}
                >
                  <div className="font-medium mb-1">{action.title}</div>
                  <div className="text-sm opacity-90">{action.description}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Recent Students */}
          <Card title="Recent Students" testId="recent-students-card">
            <Table
              columns={studentColumns}
              data={recentStudents}
              testId="recent-students-table"
            />
            
            <div className="mt-4 text-center">
              <Button
                onClick={() => window.location.href = '/admin/students'}
                variant="secondary"
                testId="view-all-students-btn"
              >
                View All Students
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}