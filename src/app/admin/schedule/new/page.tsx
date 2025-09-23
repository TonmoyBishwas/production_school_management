'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import TimeInput from '@/components/TimeInput';

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
}

interface Subject {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  grade: number;
  section: string;
  day: string;
  periodNum: number;
  startTime: string;
  endTime: string;
  teacherId: string;
  subjectId: string;
}

export default function CreateSchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [existingSchedules, setExistingSchedules] = useState<Schedule[]>([]);
  
  const [scheduleData, setScheduleData] = useState({
    grade: '',
    section: '',
    day: '',
    periodNum: '',
    startTime: '',
    endTime: '',
    subjectId: '',
    teacherId: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [conflictInfo, setConflictInfo] = useState('');

  const navItems = [
    { label: 'Dashboard', href: '/admin', testId: 'nav-dashboard' },
    { label: 'Students', href: '/admin/students', testId: 'nav-students' },
    { label: 'Teachers', href: '/admin/teachers', testId: 'nav-teachers' },
    { label: 'Schedule', href: '/admin/schedule', testId: 'nav-schedule' },
    { label: 'Calendar', href: '/admin/calendar', testId: 'nav-calendar' }
  ];

  const user = {
    username: 'School Admin',
    role: 'admin'
  };

  const days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const sections = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [teachersRes, subjectsRes, schedulesRes] = await Promise.all([
        fetch('/api/admin/teachers', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/subjects', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/schedules', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData.teachers || []);
      }

      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData.subjects || []);
      }

      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json();
        setExistingSchedules(schedulesData.schedules || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Client-side validation for conflicts
    const { grade, section, day, startTime, endTime, teacherId } = scheduleData;
    
    // Check for time conflicts
    if (startTime && endTime && grade && section && day) {
      const timeConflict = getTimeConflictReason(startTime, endTime);
      if (timeConflict) {
        setError(`Schedule conflict: ${timeConflict}`);
        setLoading(false);
        return;
      }
    }
    
    // Check for teacher conflicts
    if (teacherId && day && startTime && endTime) {
      const teacherConflict = getTeacherConflictReason(teacherId);
      if (teacherConflict) {
        setError(`Teacher conflict: ${teacherConflict}`);
        setLoading(false);
        return;
      }
    }

    // Validate time range
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}:00`);
      const end = new Date(`2000-01-01T${endTime}:00`);
      
      if (end <= start) {
        setError('End time must be after start time');
        setLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...scheduleData,
          grade: parseInt(scheduleData.grade),
          periodNum: parseInt(scheduleData.periodNum)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Schedule created successfully!');
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        setError(data.message || 'Failed to create schedule');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if a time slot is occupied for a specific grade, section, day, and period
  const isTimeSlotOccupied = (grade: string, section: string, day: string, periodNum: string) => {
    if (!grade || !section || !day || !periodNum) return false;
    
    return existingSchedules.some(schedule => 
      schedule.grade === parseInt(grade) &&
      schedule.section === section &&
      schedule.day === day &&
      schedule.periodNum === parseInt(periodNum)
    );
  };

  // Check if a teacher is busy at a specific day and period
  const isTeacherBusy = (teacherId: string, day: string, periodNum: string) => {
    if (!teacherId || !day || !periodNum) return false;
    
    return existingSchedules.some(schedule => 
      schedule.teacherId === teacherId &&
      schedule.day === day &&
      schedule.periodNum === parseInt(periodNum)
    );
  };

  // Check if two time ranges overlap
  const timeRangesOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    if (!start1 || !end1 || !start2 || !end2) return false;
    
    const startTime1 = new Date(`2000-01-01T${start1}:00`);
    const endTime1 = new Date(`2000-01-01T${end1}:00`);
    const startTime2 = new Date(`2000-01-01T${start2}:00`);
    const endTime2 = new Date(`2000-01-01T${end2}:00`);
    
    return startTime1 < endTime2 && startTime2 < endTime1;
  };

  // Check if a teacher is busy during a specific time slot
  const isTeacherBusyAtTime = (teacherId: string, day: string, startTime: string, endTime: string) => {
    if (!teacherId || !day || !startTime || !endTime) return false;
    
    return existingSchedules.some(schedule => 
      schedule.teacherId === teacherId &&
      schedule.day === day &&
      timeRangesOverlap(startTime, endTime, schedule.startTime, schedule.endTime)
    );
  };

  // Check if a time slot is occupied for class
  const isTimeSlotOccupiedForClass = (grade: string, section: string, day: string, startTime: string, endTime: string) => {
    if (!grade || !section || !day || !startTime || !endTime) return false;
    
    return existingSchedules.some(schedule => 
      schedule.grade === parseInt(grade) &&
      schedule.section === section &&
      schedule.day === day &&
      timeRangesOverlap(startTime, endTime, schedule.startTime, schedule.endTime)
    );
  };

  // Get conflict reasons for period numbers
  const getPeriodConflictReason = (periodNum: number) => {
    const { grade, section, day } = scheduleData;
    
    if (!grade || !section || !day) return null;
    
    const conflict = existingSchedules.find(schedule => 
      schedule.grade === parseInt(grade) &&
      schedule.section === section &&
      schedule.day === day &&
      schedule.periodNum === periodNum
    );
    
    return conflict ? `Occupied by ${subjects.find(s => s.id === conflict.subjectId)?.name || 'Unknown Subject'}` : null;
  };

  // Get conflict reasons for teachers
  const getTeacherConflictReason = (teacherId: string) => {
    const { day, startTime, endTime } = scheduleData;
    
    if (!day || !teacherId) return null;
    
    // If we have time info, use time-based checking
    if (startTime && endTime) {
      const conflict = existingSchedules.find(schedule => 
        schedule.teacherId === teacherId &&
        schedule.day === day &&
        timeRangesOverlap(startTime, endTime, schedule.startTime, schedule.endTime)
      );
      
      if (conflict) {
        return `Teaching Grade ${conflict.grade} Section ${conflict.section} (${conflict.startTime}-${conflict.endTime})`;
      }
    }
    
    return null;
  };

  // Get time conflict reasons for class
  const getTimeConflictReason = (startTime: string, endTime: string) => {
    const { grade, section, day } = scheduleData;
    
    if (!grade || !section || !day || !startTime || !endTime) return null;
    
    const conflict = existingSchedules.find(schedule => 
      schedule.grade === parseInt(grade) &&
      schedule.section === section &&
      schedule.day === day &&
      timeRangesOverlap(startTime, endTime, schedule.startTime, schedule.endTime)
    );
    
    return conflict ? `Overlaps with ${subjects.find(s => s.id === conflict.subjectId)?.name || 'Unknown Subject'} (${conflict.startTime}-${conflict.endTime})` : null;
  };

  // Update conflict info when form data changes
  useEffect(() => {
    const { grade, section, day, startTime, endTime, teacherId } = scheduleData;
    
    if (grade && section && day) {
      const occupiedSlots = existingSchedules.filter(schedule => 
        schedule.grade === parseInt(grade) &&
        schedule.section === section &&
        schedule.day === day
      ).length;
      
      const availableSlots = 10 - occupiedSlots;
      
      let statusMessage = '';
      
      // Check for time conflicts
      if (startTime && endTime) {
        const timeConflict = getTimeConflictReason(startTime, endTime);
        if (timeConflict) {
          statusMessage = `⚠️ Time conflict: ${timeConflict}`;
        } else {
          statusMessage = `✅ Time slot ${startTime}-${endTime} is available for Grade ${grade} Section ${section} on ${day}`;
        }
      } else {
        // Show general availability
        if (availableSlots === 0) {
          statusMessage = `⚠️ All time slots are occupied for Grade ${grade} Section ${section} on ${day}`;
        } else if (availableSlots <= 2) {
          statusMessage = `⚠️ Only ${availableSlots} time slots available for Grade ${grade} Section ${section} on ${day}`;
        } else {
          statusMessage = `✅ ${availableSlots} time slots available for Grade ${grade} Section ${section} on ${day}`;
        }
      }
      
      // Add teacher availability info
      if (teacherId && startTime && endTime && day) {
        const teacherConflict = getTeacherConflictReason(teacherId);
        if (teacherConflict) {
          statusMessage += ` | ⚠️ Teacher conflict: ${teacherConflict}`;
        } else {
          const teacher = teachers.find(t => t.id === teacherId);
          if (teacher) {
            statusMessage += ` | ✅ ${teacher.name} is available`;
          }
        }
      }
      
      setConflictInfo(statusMessage);
    } else {
      setConflictInfo('');
    }
  }, [scheduleData, existingSchedules, teachers, subjects]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} navItems={navItems} />
      
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Schedule</h1>
          <p className="text-gray-600 mt-2">Add a new class schedule entry</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {conflictInfo && (
              <div className={`px-4 py-3 rounded ${
                conflictInfo.includes('⚠️') 
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' 
                  : 'bg-blue-50 border border-blue-200 text-blue-700'
              }`}>
                {conflictInfo}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Grade"
                value={scheduleData.grade}
                onChange={(value) => setScheduleData({
                  ...scheduleData, 
                  grade: value, 
                  periodNum: '',
                  teacherId: ''
                })}
                options={grades.map(g => ({ value: g.toString(), label: `Grade ${g}` }))}
                required
                testId="grade-select"
              />

              <Select
                label="Section"
                value={scheduleData.section}
                onChange={(value) => setScheduleData({
                  ...scheduleData, 
                  section: value, 
                  periodNum: '',
                  teacherId: ''
                })}
                options={sections.map(s => ({ value: s, label: `Section ${s}` }))}
                required
                testId="section-select"
              />

              <Select
                label="Day"
                value={scheduleData.day}
                onChange={(value) => setScheduleData({
                  ...scheduleData, 
                  day: value, 
                  periodNum: '',
                  teacherId: ''
                })}
                options={days.map(d => ({ value: d, label: d }))}
                required
                testId="day-select"
              />

              <Select
                label="Period Number"
                value={scheduleData.periodNum}
                onChange={(value) => setScheduleData({
                  ...scheduleData, 
                  periodNum: value, 
                  teacherId: ''
                })}
                options={Array.from({length: 10}, (_, i) => {
                  const periodNum = i + 1;
                  const conflict = getPeriodConflictReason(periodNum);
                  return {
                    value: periodNum.toString(),
                    label: `Period ${periodNum}`,
                    disabled: !!conflict,
                    subtitle: conflict || undefined
                  };
                })}
                required
                testId="period-select"
                placeholder="Select Period"
              />

              <TimeInput
                label="Start Time"
                value={scheduleData.startTime}
                onChange={(value) => setScheduleData({
                  ...scheduleData, 
                  startTime: value,
                  teacherId: '' // Reset teacher when time changes
                })}
                required
                testId="start-time-input"
                placeholder="Select start time"
                warning={scheduleData.startTime && scheduleData.endTime ? 
                  getTimeConflictReason(scheduleData.startTime, scheduleData.endTime) || undefined : undefined}
              />

              <TimeInput
                label="End Time"
                value={scheduleData.endTime}
                onChange={(value) => setScheduleData({
                  ...scheduleData, 
                  endTime: value,
                  teacherId: '' // Reset teacher when time changes
                })}
                required
                testId="end-time-input"
                placeholder="Select end time"
                warning={scheduleData.startTime && scheduleData.endTime ? 
                  getTimeConflictReason(scheduleData.startTime, scheduleData.endTime) || undefined : undefined}
              />

              <Select
                label="Subject"
                value={scheduleData.subjectId}
                onChange={(value) => setScheduleData({...scheduleData, subjectId: value})}
                options={subjects.map(s => ({ value: s.id, label: s.name }))}
                required
                testId="subject-select"
              />

              <Select
                label="Teacher"
                value={scheduleData.teacherId}
                onChange={(value) => setScheduleData({...scheduleData, teacherId: value})}
                options={teachers.map(t => {
                  const conflict = getTeacherConflictReason(t.id);
                  return {
                    value: t.id,
                    label: t.name,
                    disabled: !!conflict,
                    subtitle: conflict || undefined
                  };
                })}
                required
                testId="teacher-select"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/admin')}
                testId="cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                testId="submit-button"
              >
                Create Schedule
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}