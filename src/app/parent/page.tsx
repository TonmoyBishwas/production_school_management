'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import Select from '@/components/Select';

interface ParentStats {
  totalChildren: number;
  averageAttendance: number;
  pendingFees: number;
  totalFeesPaid: number;
}

interface Child {
  id: string;
  studentId: string;
  name: string;
  grade: number;
  section: string;
  attendancePercentage: number;
  averageGrade: number;
}

export default function ParentDashboard() {
  const [stats, setStats] = useState<ParentStats>({
    totalChildren: 0,
    averageAttendance: 0,
    pendingFees: 0,
    totalFeesPaid: 0
  });
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [childAttendance, setChildAttendance] = useState([]);
  const [childGrades, setChildGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { label: 'Dashboard', href: '/parent', testId: 'nav-dashboard' },
    { label: 'Attendance', href: '/parent/attendance', testId: 'nav-attendance' },
    { label: 'Grades', href: '/parent/grades', testId: 'nav-grades' },
    { label: 'Payments', href: '/parent/payments', testId: 'nav-payments' },
    { label: 'Reports', href: '/parent/reports', testId: 'nav-reports' },
    { label: 'Calendar', href: '/parent/calendar', testId: 'nav-calendar' }
  ];

  const user = {
    username: 'Parent',
    role: 'parent'
  };

  useEffect(() => {
    fetchParentData();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild);
    }
  }, [selectedChild]);

  const fetchParentData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/parent/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setChildren(data.children || []);
        
        // Auto-select first child if available
        if (data.children && data.children.length > 0) {
          setSelectedChild(data.children[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching parent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async (childId: string) => {
    try {
      const token = localStorage.getItem('token');
      const [attendanceRes, gradesRes] = await Promise.all([
        fetch(`/api/parent/child/${childId}/attendance`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/parent/child/${childId}/grades`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setChildAttendance(attendanceData.attendance || []);
      }

      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        setChildGrades(gradesData.grades || []);
      }
    } catch (error) {
      console.error('Error fetching child data:', error);
    }
  };

  const attendanceColumns = [
    { key: 'date', label: 'Date' },
    { key: 'subject', label: 'Subject' },
    { key: 'period', label: 'Period' },
    { key: 'status', label: 'Status' }
  ];

  const gradesColumns = [
    { key: 'exam', label: 'Exam' },
    { key: 'subject', label: 'Subject' },
    { key: 'marksObtained', label: 'Marks Obtained' },
    { key: 'totalMarks', label: 'Total Marks' },
    { key: 'percentage', label: 'Percentage' },
    { key: 'grade', label: 'Grade' }
  ];

  const childOptions = children.map(child => ({
    value: child.id,
    label: `${child.name} (Grade ${child.grade}${child.section})`
  }));

  const selectedChildInfo = children.find(child => child.id === selectedChild);

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your child's academic progress and school activities</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card testId="total-children-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary" data-testid="total-children">
                {stats.totalChildren}
              </div>
              <div className="text-sm text-gray-600 mt-1">Children Enrolled</div>
            </div>
          </Card>

          <Card testId="average-attendance-card">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getAttendanceColor(stats.averageAttendance)}`} data-testid="average-attendance">
                {stats.averageAttendance.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Average Attendance</div>
            </div>
          </Card>

          <Card testId="pending-fees-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-error" data-testid="pending-fees">
                ₹{stats.pendingFees.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">Pending Fees</div>
            </div>
          </Card>

          <Card testId="total-paid-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-success" data-testid="total-paid">
                ₹{stats.totalFeesPaid.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Fees Paid</div>
            </div>
          </Card>
        </div>

        {/* Children Overview */}
        <Card title="My Children" testId="children-overview-card" className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <div 
                key={child.id} 
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedChild(child.id)}
                data-testid={`child-card-${child.id}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{child.name}</h3>
                    <p className="text-sm text-gray-500">
                      Grade {child.grade}{child.section} • {child.studentId}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getAttendanceColor(child.attendancePercentage)}`}>
                      {child.attendancePercentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Attendance</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Grade:</span>
                    <span className={`font-medium ${getGradeColor(child.averageGrade)}`}>
                      {child.averageGrade > 0 ? child.averageGrade.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {children.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">No children found</div>
            </div>
          )}
        </Card>

        {/* Child Details */}
        {children.length > 0 && (
          <>
            <Card title="Child Details" testId="child-details-card" className="mb-8">
              <div className="mb-6">
                <Select
                  label="Select Child"
                  value={selectedChild}
                  onChange={setSelectedChild}
                  options={childOptions}
                  testId="child-select"
                />
              </div>

              {selectedChildInfo && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {selectedChildInfo.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {selectedChildInfo.studentId}
                    </div>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getAttendanceColor(selectedChildInfo.attendancePercentage)}`}>
                      {selectedChildInfo.attendancePercentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Attendance</div>
                  </div>

                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getGradeColor(selectedChildInfo.averageGrade)}`}>
                      {selectedChildInfo.averageGrade > 0 ? selectedChildInfo.averageGrade.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Average Grade</div>
                  </div>
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Attendance */}
              <Card title="Recent Attendance" testId="child-attendance-card">
                <Table
                  columns={attendanceColumns}
                  data={childAttendance}
                  testId="child-attendance-table"
                />
                
                <div className="mt-4 text-center">
                  <Button
                    onClick={() => window.location.href = '/parent/attendance'}
                    variant="secondary"
                    testId="view-full-attendance-btn"
                  >
                    View Full Attendance
                  </Button>
                </div>
              </Card>

              {/* Recent Grades */}
              <Card title="Recent Grades" testId="child-grades-card">
                <Table
                  columns={gradesColumns}
                  data={childGrades}
                  testId="child-grades-table"
                />
                
                <div className="mt-4 text-center">
                  <Button
                    onClick={() => window.location.href = '/parent/grades'}
                    variant="secondary"
                    testId="view-all-grades-btn"
                  >
                    View All Grades
                  </Button>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <Card title="Quick Actions" testId="quick-actions-card">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => window.location.href = '/parent/payments'}
                    testId="pay-fees-btn"
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-1">💳</div>
                    <div className="text-sm">Pay Fees</div>
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = '/parent/reports'}
                    testId="download-reports-btn"
                    variant="secondary"
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-sm">Download Reports</div>
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = '/parent/calendar'}
                    testId="view-calendar-btn"
                    variant="secondary"
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-1">📅</div>
                    <div className="text-sm">School Calendar</div>
                  </Button>
                  
                  <Button
                    onClick={() => window.location.href = '/parent/contact'}
                    testId="contact-school-btn"
                    variant="secondary"
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl mb-1">📞</div>
                    <div className="text-sm">Contact School</div>
                  </Button>
                </div>
              </Card>
            </div>

            {/* Alerts */}
            {selectedChildInfo && selectedChildInfo.attendancePercentage < 75 && (
              <div className="mt-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="text-red-400 text-xl">⚠️</div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Low Attendance Alert - {selectedChildInfo.name}
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          Your child's attendance ({selectedChildInfo.attendancePercentage.toFixed(1)}%) 
                          is below the required minimum of 75%. Please ensure regular attendance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}