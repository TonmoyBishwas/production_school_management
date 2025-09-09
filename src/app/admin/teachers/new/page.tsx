'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';

interface TeacherFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  bloodGroup: string;
  hireDate: string;
  subjects: string[];
  address: string;
}

export default function NewTeacherPage() {
  const [formData, setFormData] = useState<TeacherFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    bloodGroup: '',
    hireDate: '',
    subjects: [],
    address: ''
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);
  const [availableSubjects] = useState([
    'Mathematics', 'English', 'Science', 'Social Studies', 'Hindi',
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Physical Education',
    'Art', 'Music', 'History', 'Geography', 'Economics'
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  const bloodGroupOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' }
  ];

  const handleSubjectChange = (subject: string) => {
    const newSubjects = formData.subjects.includes(subject)
      ? formData.subjects.filter(s => s !== subject)
      : [...formData.subjects, subject];
    setFormData({ ...formData, subjects: newSubjects });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length < 3) {
      setError('Minimum 3 photos required');
      return;
    }
    
    if (files.length > 10) {
      setError('Maximum 10 photos allowed');
      return;
    }

    // Validate file types and sizes
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setError('Only JPG and PNG files are allowed');
        return;
      }
      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return;
      }
    }

    setPhotos(files);
    setError('');
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    
    if (newPhotos.length < 3) {
      setError('Minimum 3 photos required');
    } else {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (photos.length < 3) {
      setError('Minimum 3 photos required');
      return;
    }

    if (formData.subjects.length === 0) {
      setError('Please select at least one subject');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'subjects') {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, value);
        }
      });
      
      // Add photos
      photos.forEach((photo, index) => {
        formDataToSend.append('photos', photo);
      });

      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data);
      } else {
        setError(data.message || 'Failed to register teacher');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} navItems={navItems} />
        
        <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Card title="Teacher Registered Successfully" testId="success-card">
            <div className="text-center mb-6">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {success.teacher.name} has been registered!
              </h2>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Teacher ID:</span>
                  <div className="text-primary font-mono text-lg" data-testid="teacher-id">
                    {success.teacher.teacherId}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Username:</span>
                  <div className="text-primary font-mono" data-testid="teacher-username">
                    {success.teacher.username}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Password:</span>
                  <div className="text-error font-mono" data-testid="teacher-password">
                    {success.teacher.password}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Photos:</span>
                  <div className="text-success font-mono">
                    {success.teacher.photoCount} uploaded
                  </div>
                </div>
              </div>

              <div>
                <span className="font-medium">Subjects:</span>
                <div className="mt-1">
                  {success.teacher.subjects.map((subject: string, index: number) => (
                    <span key={index} className="inline-block bg-primary text-white text-xs px-2 py-1 rounded mr-1 mb-1">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={() => router.push('/admin')}
                testId="back-to-dashboard-btn"
                className="flex-1"
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={() => {setSuccess(null); setFormData({
                  firstName: '', lastName: '', email: '', phone: '', dob: '',
                  bloodGroup: '', hireDate: '', subjects: [], address: ''
                }); setPhotos([]);}}
                variant="secondary"
                testId="register-another-btn"
                className="flex-1"
              >
                Register Another Teacher
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} navItems={navItems} />
      
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Register New Teacher</h1>
          <p className="text-gray-600 mt-2">Complete teacher information with photos and subject assignments</p>
        </div>

        <Card testId="teacher-registration-form">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" data-testid="error-message">
                {error}
              </div>
            )}

            {/* Teacher Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Teacher Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(value) => setFormData({ ...formData, firstName: value })}
                  placeholder="Enter first name"
                  required
                  testId="first-name-input"
                />

                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(value) => setFormData({ ...formData, lastName: value })}
                  placeholder="Enter last name"
                  required
                  testId="last-name-input"
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(value) => setFormData({ ...formData, email: value })}
                  placeholder="Enter email address"
                  required
                  testId="email-input"
                />

                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                  placeholder="Enter phone number"
                  required
                  testId="phone-input"
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dob}
                  onChange={(value) => setFormData({ ...formData, dob: value })}
                  required
                  testId="dob-input"
                />

                <Select
                  label="Blood Group"
                  value={formData.bloodGroup}
                  onChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                  options={bloodGroupOptions}
                  required
                  testId="blood-group-select"
                />

                <Input
                  label="Hire Date"
                  type="date"
                  value={formData.hireDate}
                  onChange={(value) => setFormData({ ...formData, hireDate: value })}
                  required
                  testId="hire-date-input"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    value={formData.address}
                    onChange={(value) => setFormData({ ...formData, address: value })}
                    placeholder="Enter full address"
                    required
                    testId="address-input"
                  />
                </div>
              </div>
            </div>

            {/* Subject Assignment */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Assignment</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableSubjects.map((subject) => (
                  <label key={subject} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject)}
                      onChange={() => handleSubjectChange(subject)}
                      data-testid={`subject-${subject.toLowerCase().replace(/\s+/g, '-')}`}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{subject}</span>
                  </label>
                ))}
              </div>
              {formData.subjects.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {formData.subjects.join(', ')}
                </div>
              )}
            </div>

            {/* Photo Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Teacher Photos (3-10 required)</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoChange}
                  className="hidden"
                  data-testid="photo-input"
                />
                
                <div className="text-center">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="secondary"
                    testId="select-photos-btn"
                  >
                    Select Photos (3-10 JPG/PNG files)
                  </Button>
                  <p className="text-gray-500 text-sm mt-2">
                    Each file must be less than 5MB
                  </p>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      Selected Photos: {photos.length}
                    </span>
                    <span className={`text-sm ${photos.length >= 3 ? 'text-success' : 'text-error'}`}>
                      {photos.length >= 3 ? '✓ Ready' : `Need ${3 - photos.length} more`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${index + 1}`}
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-error text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`remove-photo-${index}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/admin')}
                testId="cancel-btn"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                testId="register-teacher-btn"
                className="flex-1"
                disabled={photos.length < 3 || formData.subjects.length === 0}
              >
                Register Teacher
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}