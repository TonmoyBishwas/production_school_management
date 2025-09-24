'use client';

import React, { useState, useEffect } from 'react';

// Force dynamic rendering to prevent build errors with localStorage
export const dynamic = 'force-dynamic';
import Navbar from '@/components/Navbar';

interface ReportData {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  activeSchools: number;
  newRegistrationsThisMonth: number;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    totalSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    activeSchools: 0,
    newRegistrationsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  const navItems = [
    { label: 'Dashboard', href: '/superadmin', testId: 'nav-dashboard' },
    { label: 'Schools', href: '/superadmin/schools', testId: 'nav-schools' },
    { label: 'Reports', href: '/superadmin/reports', testId: 'nav-reports' }
  ];

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/superadmin/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data.reports || {
          totalSchools: 0,
          totalStudents: 0,
          totalTeachers: 0,
          activeSchools: 0,
          newRegistrationsThisMonth: 0
        });
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const user = {
    username: 'Superadmin',
    role: 'superadmin'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} navItems={navItems} />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Reports</h1>
          <p className="text-gray-600 mt-2">Comprehensive overview of system performance and statistics</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {reportData.totalSchools}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Schools</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {reportData.totalStudents}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Students</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {reportData.totalTeachers}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Teachers</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {reportData.activeSchools}
              </div>
              <div className="text-sm text-gray-600 mt-1">Active Schools</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {reportData.newRegistrationsThisMonth}
              </div>
              <div className="text-sm text-gray-600 mt-1">New This Month</div>
            </div>
          </div>
        </div>

        {/* Report Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Activity */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">User Logins Today</span>
                <span className="text-sm font-medium">Coming Soon</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Sessions</span>
                <span className="text-sm font-medium">Coming Soon</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">System Uptime</span>
                <span className="text-sm font-medium">99.9%</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                No recent activity to display
              </div>
              <div className="text-xs text-gray-500">
                Activity logs will appear here as the system is used
              </div>
            </div>
          </div>
        </div>

        {/* Data Export */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
          <div className="flex space-x-4">
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled
            >
              Export Schools Data (Coming Soon)
            </button>
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled
            >
              Export User Data (Coming Soon)
            </button>
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled
            >
              Export System Logs (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}