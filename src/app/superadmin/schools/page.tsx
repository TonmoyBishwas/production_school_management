'use client';

import React, { useState, useEffect } from 'react';

// Force dynamic rendering to prevent build errors with localStorage
export const dynamic = 'force-dynamic';
import Navbar from '@/components/Navbar';
import Table from '@/components/Table';

interface School {
  id: string;
  name: string;
  adminUsername: string;
  createdAt: string;
  totalStudents: number;
  totalTeachers: number;
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { label: 'Dashboard', href: '/superadmin', testId: 'nav-dashboard' },
    { label: 'Schools', href: '/superadmin/schools', testId: 'nav-schools' },
    { label: 'Reports', href: '/superadmin/reports', testId: 'nav-reports' }
  ];

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/superadmin/schools', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools || []);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSchool = () => {
    window.location.href = '/superadmin/schools/new';
  };

  const columns = [
    { key: 'name', label: 'School Name' },
    { key: 'adminUsername', label: 'Admin Username' },
    { key: 'totalStudents', label: 'Students' },
    { key: 'totalTeachers', label: 'Teachers' },
    { key: 'createdAt', label: 'Created Date' }
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">Schools Management</h1>
          <p className="text-gray-600 mt-2">Manage and monitor all registered schools</p>
        </div>

        {/* Schools Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">All Schools</h3>
              <p className="text-sm text-gray-600">View and manage registered schools</p>
            </div>
            <button
              onClick={handleNewSchool}
              data-testid="add-school-btn"
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add New School
            </button>
          </div>

          <Table
            columns={columns}
            data={schools}
            testId="schools-table"
            onRowClick={(school) => {
              window.location.href = `/superadmin/schools/${school.id}`;
            }}
          />

          {schools.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No schools registered yet</div>
              <button
                onClick={handleNewSchool}
                data-testid="add-first-school-btn"
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Register First School
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}