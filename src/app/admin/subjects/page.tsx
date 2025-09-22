'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';

interface Subject {
  id: string;
  name: string;
  code: string;
  gradeLevel: number;
  description: string;
  teachers: string[];
  teacherCount: number;
  createdAt: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [filterByTeachers, setFilterByTeachers] = useState<string>('all');

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
    fetchSubjects();
  }, []);

  useEffect(() => {
    filterAndSortSubjects();
  }, [subjects, selectedGrade, searchTerm, sortBy, filterByTeachers]);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSubjects = () => {
    let filtered = subjects;

    // Filter by grade level
    if (selectedGrade !== 'all') {
      if (selectedGrade === '0') {
        filtered = filtered.filter(subject => subject.gradeLevel === 0);
      } else {
        filtered = filtered.filter(subject => subject.gradeLevel.toString() === selectedGrade);
      }
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by teacher assignment
    if (filterByTeachers === 'assigned') {
      filtered = filtered.filter(subject => subject.teacherCount > 0);
    } else if (filterByTeachers === 'unassigned') {
      filtered = filtered.filter(subject => subject.teacherCount === 0);
    }

    // Sort subjects
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'code':
          return a.code.localeCompare(b.code);
        case 'gradeLevel':
          return a.gradeLevel - b.gradeLevel;
        case 'teacherCount':
          return b.teacherCount - a.teacherCount; // Most teachers first
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
        default:
          return 0;
      }
    });

    setFilteredSubjects(filtered);
  };

  // Get unique grade levels for filter dropdown
  const availableGrades = Array.from(new Set(subjects.map(s => s.gradeLevel))).sort((a, b) => a - b);

  const subjectColumns = [
    { key: 'code', label: 'Subject Code' },
    { key: 'name', label: 'Subject Name' },
    { key: 'gradeLevel', label: 'Grade Level', render: (value: number) => value === 0 ? 'All Grades' : `Grade ${value}` },
    { key: 'description', label: 'Description' },
    { 
      key: 'teachers', 
      label: 'Assigned Teachers',
      render: (value: string[], row: Subject) => (
        <div>
          {row.teacherCount === 0 ? (
            <span className="text-red-600 font-medium">No teachers assigned</span>
          ) : (
            <div>
              <span className="text-green-600 font-medium">{row.teacherCount} teacher{row.teacherCount > 1 ? 's' : ''}</span>
              {value.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {value.slice(0, 2).join(', ')}
                  {value.length > 2 && ` +${value.length - 2} more`}
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    { key: 'createdAt', label: 'Created Date' }
  ];

  // Group subjects by grade level for better organization
  const groupedSubjects = filteredSubjects.reduce((acc, subject) => {
    const grade = subject.gradeLevel === 0 ? 'All Grades' : `Grade ${subject.gradeLevel}`;
    if (!acc[grade]) {
      acc[grade] = [];
    }
    acc[grade].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

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
            <h1 className="text-3xl font-bold text-gray-900">Subjects Management</h1>
            <p className="text-gray-600 mt-2">Manage school curriculum and subject assignments</p>
          </div>
          <Button
            onClick={() => window.location.href = '/admin/subjects/new'}
            variant="primary"
            testId="add-subject-btn"
          >
            Create New Subject
          </Button>
        </div>

        {/* Filters and Search */}
        <Card title="Filter & Search Subjects" testId="filters-card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Subjects
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, code, or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="search-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Grade
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="grade-filter"
              >
                <option value="all">All Grades</option>
                {availableGrades.map(grade => (
                  <option key={grade} value={grade.toString()}>
                    {grade === 0 ? 'All Grades' : `Grade ${grade}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teacher Assignment
              </label>
              <select
                value={filterByTeachers}
                onChange={(e) => setFilterByTeachers(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="teacher-filter"
              >
                <option value="all">All Subjects</option>
                <option value="assigned">With Teachers</option>
                <option value="unassigned">Without Teachers</option>
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
                <option value="name">Subject Name</option>
                <option value="code">Subject Code</option>
                <option value="gradeLevel">Grade Level</option>
                <option value="teacherCount">Teacher Count</option>
                <option value="createdAt">Created Date</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredSubjects.length} of {subjects.length} subjects
              {selectedGrade !== 'all' && ` • Grade: ${selectedGrade === '0' ? 'All Grades' : `Grade ${selectedGrade}`}`}
              {filterByTeachers !== 'all' && ` • ${filterByTeachers === 'assigned' ? 'With Teachers' : 'Without Teachers'}`}
              {searchTerm && ` • Search: "${searchTerm}"`}
            </div>
            <Button
              onClick={() => {
                setSelectedGrade('all');
                setSearchTerm('');
                setSortBy('name');
                setFilterByTeachers('all');
              }}
              variant="secondary"
              testId="clear-filters-btn"
            >
              Clear All Filters
            </Button>
          </div>
        </Card>

        {/* Subjects Display */}
        {subjects.length === 0 ? (
          <Card title="No Subjects Found" testId="empty-subjects-card">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No subjects created yet</div>
              <Button
                onClick={() => window.location.href = '/admin/subjects/new'}
                variant="primary"
                testId="empty-add-subject-btn"
              >
                Create First Subject
              </Button>
            </div>
          </Card>
        ) : filteredSubjects.length === 0 ? (
          <Card title="No Subjects Match Filters" testId="no-match-card">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                No subjects found for the current filters
              </div>
              <Button
                onClick={() => {
                  setSelectedGrade('all');
                  setSearchTerm('');
                  setSortBy('name');
                  setFilterByTeachers('all');
                }}
                variant="secondary"
                testId="reset-filters-btn"
              >
                Show All Subjects
              </Button>
            </div>
          </Card>
        ) : (
          /* Group by Grade Level */
          <div className="space-y-6">
            {Object.entries(groupedSubjects).map(([grade, gradeSubjects]) => (
              <Card 
                key={grade} 
                title={`${grade} Subjects (${gradeSubjects.length})`} 
                testId={`subjects-group-${grade.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <Table
                  columns={subjectColumns}
                  data={gradeSubjects}
                  testId={`subjects-table-${grade.replace(/\s+/g, '-').toLowerCase()}`}
                />
              </Card>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        {subjects.length > 0 && (
          <div className="mt-8">
            <Card title="Subject Statistics" testId="stats-card">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{subjects.length}</div>
                  <div className="text-sm text-blue-600">Total Subjects</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {subjects.filter(s => s.teacherCount > 0).length}
                  </div>
                  <div className="text-sm text-green-600">With Teachers</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {subjects.filter(s => s.teacherCount === 0).length}
                  </div>
                  <div className="text-sm text-red-600">Need Teachers</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{availableGrades.length}</div>
                  <div className="text-sm text-purple-600">Grade Levels</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}