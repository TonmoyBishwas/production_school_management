'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';

interface StudentFormData {
  firstName: string;
  lastName: string;
  dob: string;
  bloodGroup: string;
  grade: string;
  section: string;
  parentFirstName: string;
  parentLastName: string;
  parentPhone: string;
  parentEmail: string;
  parentOccupation: string;
  address: string;
}

export default function NewStudentPage() {
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: '',
    lastName: '',
    dob: '',
    bloodGroup: '',
    grade: '',
    section: '',
    parentFirstName: '',
    parentLastName: '',
    parentPhone: '',
    parentEmail: '',
    parentOccupation: '',
    address: ''
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);
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

  const gradeOptions = Array.from({ length: 10 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Grade ${i + 1}`
  }));

  const sectionOptions = ['A', 'B', 'C', 'D'].map(letter => ({
    value: letter,
    label: `Section ${letter}`
  }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length < 5) {
      setError('Minimum 5 photos required');
      return;
    }
    
    if (files.length > 20) {
      setError('Maximum 20 photos allowed');
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
    
    if (newPhotos.length < 5) {
      setError('Minimum 5 photos required');
    } else {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (photos.length < 5) {
      setError('Minimum 5 photos required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      // Add photos
      photos.forEach((photo, index) => {
        formDataToSend.append('photos', photo);
      });

      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/students', {
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
        setError(data.message || 'Failed to register student');
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
          <Card title="Student Registered Successfully" testId="success-card">
            <div className="text-center mb-6">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {success.student.name} has been registered!
              </h2>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Student ID:</span>
                  <div className="text-primary font-mono text-lg" data-testid="student-id">
                    {success.student.studentId}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Username:</span>
                  <div className="text-primary font-mono" data-testid="student-username">
                    {success.student.username}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Password:</span>
                  <div className="text-error font-mono" data-testid="student-password">
                    {success.student.password}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Photos:</span>
                  <div className="text-success font-mono">
                    {success.student.photoCount} uploaded
                  </div>
                </div>
              </div>

              {success.parent && (
                <div className="border-t pt-4">
                  <h4 className="font-bold mb-2">Parent Account Created:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Username:</span>
                      <div className="text-primary font-mono" data-testid="parent-username">
                        {success.parent.username}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Password:</span>
                      <div className="text-error font-mono" data-testid="parent-password">
                        {success.parent.password}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  firstName: '', lastName: '', dob: '', bloodGroup: '',
                  grade: '', section: '', parentFirstName: '', parentLastName: '',
                  parentPhone: '', parentEmail: '', parentOccupation: '', address: ''
                }); setPhotos([]);}}
                variant="secondary"
                testId="register-another-btn"
                className="flex-1"
              >
                Register Another Student
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
          <h1 className="text-3xl font-bold text-gray-900">Register New Student</h1>
          <p className="text-gray-600 mt-2">Complete student information with 5-20 photos</p>
        </div>

        <Card testId="student-registration-form">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" data-testid="error-message">
                {error}
              </div>
            )}

            {/* Student Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
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

                <Select
                  label="Grade"
                  value={formData.grade}
                  onChange={(value) => setFormData({ ...formData, grade: value })}
                  options={gradeOptions}
                  required
                  testId="grade-select"
                />

                <Select
                  label="Section"
                  value={formData.section}
                  onChange={(value) => setFormData({ ...formData, section: value })}
                  options={sectionOptions}
                  required
                  testId="section-select"
                />
              </div>
            </div>

            {/* Parent Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Parent Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Parent First Name"
                  value={formData.parentFirstName}
                  onChange={(value) => setFormData({ ...formData, parentFirstName: value })}
                  placeholder="Enter parent's first name"
                  required
                  testId="parent-first-name-input"
                />

                <Input
                  label="Parent Last Name"
                  value={formData.parentLastName}
                  onChange={(value) => setFormData({ ...formData, parentLastName: value })}
                  placeholder="Enter parent's last name"
                  required
                  testId="parent-last-name-input"
                />

                <Input
                  label="Parent Phone"
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(value) => setFormData({ ...formData, parentPhone: value })}
                  placeholder="Enter phone number"
                  required
                  testId="parent-phone-input"
                />

                <Input
                  label="Parent Email"
                  type="email"
                  value={formData.parentEmail}
                  onChange={(value) => setFormData({ ...formData, parentEmail: value })}
                  placeholder="Enter email address"
                  testId="parent-email-input"
                />

                <Input
                  label="Occupation"
                  value={formData.parentOccupation}
                  onChange={(value) => setFormData({ ...formData, parentOccupation: value })}
                  placeholder="Enter occupation"
                  testId="parent-occupation-input"
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

            {/* Photo Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Student Photos (5-20 required)</h3>
              
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
                    Select Photos (5-20 JPG/PNG files)
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
                    <span className={`text-sm ${photos.length >= 5 ? 'text-success' : 'text-error'}`}>
                      {photos.length >= 5 ? '✓ Ready' : `Need ${5 - photos.length} more`}
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
                testId="register-student-btn"
                className="flex-1"
                disabled={photos.length < 5}
              >
                Register Student
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}