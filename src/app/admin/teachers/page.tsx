'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';

interface Teacher {
  id: string;
  teacherId: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  hireDate: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');

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
    fetchTeachers();
  }, []);

  useEffect(() => {
    filterAndSortTeachers();
  }, [teachers, selectedSubject, searchTerm, sortBy]);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTeachers = () => {
    let filtered = teachers;

    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(teacher => 
        teacher.subjects.some(subject => 
          subject.toLowerCase().includes(selectedSubject.toLowerCase())
        )
      );
    }

    // Filter by search term (name or email)
    if (searchTerm.trim()) {
      filtered = filtered.filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort teachers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'hireDate':
          return new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime(); // Newest first
        case 'email':
          return a.email.localeCompare(b.email);
        case 'subjects':
          return a.subjects.length - b.subjects.length; // Fewest subjects first
        default:
          return 0;
      }
    });

    setFilteredTeachers(filtered);
  };

  // Get unique subjects for filter dropdown
  const availableSubjects = Array.from(
    new Set(teachers.flatMap(t => t.subjects))
  ).sort();

  const teacherColumns = [
    { key: 'teacherId', label: 'Teacher ID' },
    { key: 'name', label: 'Teacher Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { 
      key: 'subjects', 
      label: 'Subjects Taught',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.map((subject, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {subject}
            </span>
          ))}
        </div>
      )
    },
    { key: 'hireDate', label: 'Hire Date' }
  ];

  // Group teachers by their primary subject for better organization
  const groupedTeachers = filteredTeachers.reduce((acc, teacher) => {
    const primarySubject = teacher.subjects[0] || 'No Subject';
    if (!acc[primarySubject]) {
      acc[primarySubject] = [];
    }
    acc[primarySubject].push(teacher);
    return acc;
  }, {} as Record<string, Teacher[]>);

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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teachers Management</h1>
            <p className="text-gray-600 mt-2">Manage and monitor all teachers</p>
          </div>
          <Button
            onClick={() => window.location.href = '/admin/teachers/new'}
            variant="primary"
            testId="add-teacher-btn"
          >
            Register New Teacher
          </Button>
        </div>

        {/* Filters and Search */}
        <Card title="Filter & Search Teachers" testId="filters-card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Teachers
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="search-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="subject-filter"
              >
                <option value="all">All Subjects</option>
                {availableSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="sort-select"
              >
                <option value="name">Name (A-Z)</option>
                <option value="hireDate">Hire Date (Newest First)</option>
                <option value="email">Email (A-Z)</option>
                <option value="subjects">Subject Count</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSelectedSubject('all');
                  setSearchTerm('');
                  setSortBy('name');
                }}
                variant="secondary"
                testId="clear-filters-btn"
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredTeachers.length} of {teachers.length} teachers
            {selectedSubject !== 'all' && ` • Subject: ${selectedSubject}`}
            {searchTerm && ` • Search: "${searchTerm}"`}
          </div>
        </Card>

        {/* Teachers Display */}
        {teachers.length === 0 ? (
          <Card title="No Teachers Found" testId="empty-teachers-card">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No teachers registered yet</div>
              <Button
                onClick={() => window.location.href = '/admin/teachers/new'}
                variant="primary"
                testId="empty-add-teacher-btn"
              >
                Register First Teacher
              </Button>
            </div>
          </Card>
        ) : filteredTeachers.length === 0 ? (
          <Card title="No Teachers Match Filters" testId="no-match-card">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                No teachers found for the current filters
              </div>
              <Button
                onClick={() => {
                  setSelectedSubject('all');
                  setSearchTerm('');
                  setSortBy('name');
                }}
                variant="secondary"
                testId="reset-filters-btn"
              >
                Show All Teachers
              </Button>
            </div>
          </Card>
        ) : (
          /* Group by Primary Subject */
          <div className="space-y-6">
            {Object.entries(groupedTeachers).map(([subject, subjectTeachers]) => (
              <Card 
                key={subject} 
                title={`${subject} Teachers (${subjectTeachers.length})`} 
                testId={`teachers-group-${subject.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <Table
                  columns={teacherColumns}
                  data={subjectTeachers}
                  testId={`teachers-table-${subject.replace(/\s+/g, '-').toLowerCase()}`}
                />
              </Card>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        {teachers.length > 0 && (
          <div className="mt-8">
            <Card title="Teacher Statistics" testId="stats-card">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{teachers.length}</div>
                  <div className="text-sm text-blue-600">Total Teachers</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{availableSubjects.length}</div>
                  <div className="text-sm text-green-600">Subjects Taught</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(teachers.reduce((acc, t) => acc + t.subjects.length, 0) / teachers.length * 10) / 10 || 0}
                  </div>
                  <div className="text-sm text-purple-600">Avg Subjects/Teacher</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {teachers.filter(t => new Date(t.hireDate) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)).length}
                  </div>
                  <div className="text-sm text-orange-600">Hired This Year</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}