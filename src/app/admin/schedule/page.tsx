'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';

interface Schedule {
  id: string;
  grade: number;
  section: string;
  day: string;
  periodNum: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  teacherId: string;
  subjectId: string;
}

interface FormattedSchedule extends Schedule {
  className: string;
  dayOfWeek: string;
  timeSlot: string;
  period: string;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<FormattedSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'timetable'>('list');
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    filterAndFormatSchedules();
  }, [schedules, selectedGrade, selectedSection, selectedDay, selectedSubject, selectedTeacher, searchTerm]);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/schedules', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatScheduleData = (schedule: Schedule): FormattedSchedule => {
    return {
      ...schedule,
      className: `Grade ${schedule.grade} - Section ${schedule.section}`,
      dayOfWeek: schedule.day,
      timeSlot: `${schedule.startTime} - ${schedule.endTime}`,
      period: `Period ${schedule.periodNum}`
    };
  };

  const filterAndFormatSchedules = () => {
    let filtered = schedules;

    // Apply filters
    if (selectedGrade !== 'all') {
      filtered = filtered.filter(s => s.grade.toString() === selectedGrade);
    }

    if (selectedSection !== 'all') {
      filtered = filtered.filter(s => s.section === selectedSection);
    }

    if (selectedDay !== 'all') {
      filtered = filtered.filter(s => s.day === selectedDay);
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(s => s.subject === selectedSubject);
    }

    if (selectedTeacher !== 'all') {
      filtered = filtered.filter(s => s.teacher === selectedTeacher);
    }

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(s =>
        s.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `Grade ${s.grade} Section ${s.section}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Format and sort the data
    const formatted = filtered.map(formatScheduleData);
    
    // Sort by day, then by period number, then by grade
    formatted.sort((a, b) => {
      const dayA = daysOrder.indexOf(a.day);
      const dayB = daysOrder.indexOf(b.day);
      
      if (dayA !== dayB) return dayA - dayB;
      if (a.periodNum !== b.periodNum) return a.periodNum - b.periodNum;
      return a.grade - b.grade;
    });

    setFilteredSchedules(formatted);
  };

  // Get unique values for filters
  const availableGrades = Array.from(new Set(schedules.map(s => s.grade))).sort((a, b) => a - b);
  const availableSections = Array.from(new Set(schedules.map(s => s.section))).sort();
  const availableDays = Array.from(new Set(schedules.map(s => s.day))).sort((a, b) => 
    daysOrder.indexOf(a) - daysOrder.indexOf(b)
  );
  const availableSubjects = Array.from(new Set(schedules.map(s => s.subject))).sort();
  const availableTeachers = Array.from(new Set(schedules.map(s => s.teacher))).sort();

  const scheduleColumns = [
    { key: 'className', label: 'Class' },
    { key: 'dayOfWeek', label: 'Day' },
    { key: 'period', label: 'Period' },
    { key: 'timeSlot', label: 'Time' },
    { key: 'subject', label: 'Subject' },
    { key: 'teacher', label: 'Teacher' }
  ];

  // Group schedules by grade for better organization
  const groupedSchedules = filteredSchedules.reduce((acc, schedule) => {
    const key = `Grade ${schedule.grade} - Section ${schedule.section}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(schedule);
    return acc;
  }, {} as Record<string, FormattedSchedule[]>);

  // Timetable view data
  const getTimetableData = () => {
    const timetable: Record<string, Record<string, FormattedSchedule[]>> = {};
    
    filteredSchedules.forEach(schedule => {
      const classKey = `Grade ${schedule.grade} - Section ${schedule.section}`;
      if (!timetable[classKey]) {
        timetable[classKey] = {};
      }
      if (!timetable[classKey][schedule.day]) {
        timetable[classKey][schedule.day] = [];
      }
      timetable[classKey][schedule.day].push(schedule);
    });

    // Sort periods within each day
    Object.keys(timetable).forEach(classKey => {
      Object.keys(timetable[classKey]).forEach(day => {
        timetable[classKey][day].sort((a, b) => a.periodNum - b.periodNum);
      });
    });

    return timetable;
  };

  const clearAllFilters = () => {
    setSelectedGrade('all');
    setSelectedSection('all');
    setSelectedDay('all');
    setSelectedSubject('all');
    setSelectedTeacher('all');
    setSearchTerm('');
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schedule Management</h1>
            <p className="text-gray-600 mt-2">Manage class timetables and schedule assignments</p>
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={() => setViewMode(viewMode === 'list' ? 'timetable' : 'list')}
              variant="secondary"
              testId="view-mode-btn"
            >
              {viewMode === 'list' ? '📅 Timetable View' : '📋 List View'}
            </Button>
            <Button
              onClick={() => window.location.href = '/admin/schedule/new'}
              variant="primary"
              testId="add-schedule-btn"
            >
              Create New Schedule
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card title="Filter & Search Schedules" testId="filters-card">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search class, subject, teacher..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="search-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade
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
                Section
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="day-filter"
              >
                <option value="all">All Days</option>
                {availableDays.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
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
                Teacher
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="teacher-filter"
              >
                <option value="all">All Teachers</option>
                {availableTeachers.map(teacher => (
                  <option key={teacher} value={teacher}>{teacher}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredSchedules.length} of {schedules.length} schedules
              {selectedGrade !== 'all' && ` • Grade ${selectedGrade}`}
              {selectedSection !== 'all' && ` • Section ${selectedSection}`}
              {selectedDay !== 'all' && ` • ${selectedDay}`}
              {selectedSubject !== 'all' && ` • ${selectedSubject}`}
              {selectedTeacher !== 'all' && ` • ${selectedTeacher}`}
              {searchTerm && ` • Search: "${searchTerm}"`}
            </div>
            <Button
              onClick={clearAllFilters}
              variant="secondary"
              testId="clear-filters-btn"
            >
              Clear All Filters
            </Button>
          </div>
        </Card>

        {/* Schedule Display */}
        {schedules.length === 0 ? (
          <Card title="No Schedules Found" testId="empty-schedules-card">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No schedules created yet</div>
              <Button
                onClick={() => window.location.href = '/admin/schedule/new'}
                variant="primary"
                testId="empty-add-schedule-btn"
              >
                Create First Schedule
              </Button>
            </div>
          </Card>
        ) : filteredSchedules.length === 0 ? (
          <Card title="No Schedules Match Filters" testId="no-match-card">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                No schedules found for the current filters
              </div>
              <Button
                onClick={clearAllFilters}
                variant="secondary"
                testId="reset-filters-btn"
              >
                Show All Schedules
              </Button>
            </div>
          </Card>
        ) : viewMode === 'list' ? (
          /* List View - Group by Grade/Section */
          <div className="space-y-6">
            {Object.entries(groupedSchedules).map(([className, classSchedules]) => (
              <Card 
                key={className} 
                title={`${className} Schedule (${classSchedules.length} periods)`} 
                testId={`schedule-group-${className.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <Table
                  columns={scheduleColumns}
                  data={classSchedules}
                  testId={`schedule-table-${className.replace(/\s+/g, '-').toLowerCase()}`}
                />
              </Card>
            ))}
          </div>
        ) : (
          /* Timetable View */
          <div className="space-y-8">
            {Object.entries(getTimetableData()).map(([className, daySchedules]) => (
              <Card 
                key={className} 
                title={`${className} - Weekly Timetable`} 
                testId={`timetable-${className.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        {daysOrder.map(day => (
                          <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                        <tr key={period}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Period {period}
                          </td>
                          {daysOrder.map(day => {
                            const dayPeriod = daySchedules[day]?.find(s => s.periodNum === period);
                            return (
                              <td key={day} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {dayPeriod ? (
                                  <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">
                                    <div className="font-semibold">{dayPeriod.subject}</div>
                                    <div className="text-xs">{dayPeriod.teacher}</div>
                                    <div className="text-xs">{dayPeriod.timeSlot}</div>
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-center">-</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        {schedules.length > 0 && (
          <div className="mt-8">
            <Card title="Schedule Statistics" testId="stats-card">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{schedules.length}</div>
                  <div className="text-sm text-blue-600">Total Periods</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{availableGrades.length}</div>
                  <div className="text-sm text-green-600">Grades Scheduled</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{availableSubjects.length}</div>
                  <div className="text-sm text-purple-600">Subjects Taught</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{availableTeachers.length}</div>
                  <div className="text-sm text-orange-600">Teachers Assigned</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}