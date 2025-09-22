'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';

interface Student {
  id: string;
  studentId: string;
  name: string;
  grade: number;
  section: string;
  bloodGroup: string;
  parentName: string;
  parentPhone: string;
  admissionDate: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');

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
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, selectedGrade, selectedSection]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/students', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (selectedGrade !== 'all') {
      filtered = filtered.filter(student => student.grade.toString() === selectedGrade);
    }

    if (selectedSection !== 'all') {
      filtered = filtered.filter(student => student.section === selectedSection);
    }

    setFilteredStudents(filtered);
  };

  // Get unique grades and sections for filter dropdowns
  const availableGrades = Array.from(new Set(students.map(s => s.grade))).sort((a, b) => a - b);
  const availableSections = Array.from(new Set(students.map(s => s.section))).sort();

  const studentColumns = [
    { key: 'studentId', label: 'Student ID' },
    { key: 'name', label: 'Student Name' },
    { key: 'grade', label: 'Grade' },
    { key: 'section', label: 'Section' },
    { key: 'bloodGroup', label: 'Blood Group' },
    { key: 'parentName', label: 'Parent Name' },
    { key: 'parentPhone', label: 'Parent Phone' },
    { key: 'admissionDate', label: 'Admission Date' }
  ];

  // Group students by grade and section for better organization
  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const key = `Grade ${student.grade} - Section ${student.section}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

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
            <h1 className="text-3xl font-bold text-gray-900">Students Management</h1>
            <p className="text-gray-600 mt-2">Manage and monitor all students</p>
          </div>
          <Button
            onClick={() => window.location.href = '/admin/students/new'}
            variant="primary"
            testId="add-student-btn"
          >
            Register New Student
          </Button>
        </div>

        {/* Filters */}
        <Card title="Filter Students" testId="filters-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  <option key={grade} value={grade.toString()}>Grade {grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="section-filter"
              >
                <option value="all">All Sections</option>
                {availableSections.map(section => (
                  <option key={section} value={section}>Section {section}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSelectedGrade('all');
                  setSelectedSection('all');
                }}
                variant="secondary"
                testId="clear-filters-btn"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredStudents.length} of {students.length} students
            {selectedGrade !== 'all' && ` • Grade ${selectedGrade}`}
            {selectedSection !== 'all' && ` • Section ${selectedSection}`}
          </div>
        </Card>

        {/* Students Display */}
        {students.length === 0 ? (
          <Card title="No Students Found" testId="empty-students-card">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No students registered yet</div>
              <Button
                onClick={() => window.location.href = '/admin/students/new'}
                variant="primary"
                testId="empty-add-student-btn"
              >
                Register First Student
              </Button>
            </div>
          </Card>
        ) : filteredStudents.length === 0 ? (
          <Card title="No Students Match Filters" testId="no-match-card">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                No students found for the selected grade and section combination
              </div>
              <Button
                onClick={() => {
                  setSelectedGrade('all');
                  setSelectedSection('all');
                }}
                variant="secondary"
                testId="reset-filters-btn"
              >
                Show All Students
              </Button>
            </div>
          </Card>
        ) : (
          /* Group by Grade and Section */
          <div className="space-y-6">
            {Object.entries(groupedStudents).map(([groupName, groupStudents]) => (
              <Card 
                key={groupName} 
                title={`${groupName} (${groupStudents.length} students)`} 
                testId={`students-group-${groupName.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <Table
                  columns={studentColumns}
                  data={groupStudents}
                  testId={`students-table-${groupName.replace(/\s+/g, '-').toLowerCase()}`}
                />
              </Card>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        {students.length > 0 && (
          <div className="mt-8">
            <Card title="Student Statistics" testId="stats-card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                  <div className="text-sm text-blue-600">Total Students</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{availableGrades.length}</div>
                  <div className="text-sm text-green-600">Grades</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{availableSections.length}</div>
                  <div className="text-sm text-purple-600">Sections</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}