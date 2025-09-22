'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function NewSubjectPage() {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    gradeLevel: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Subject name and code are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          gradeLevel: parseInt(formData.gradeLevel) || 0
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Subject created successfully!');
        // Reset form
        setFormData({
          name: '',
          code: '',
          gradeLevel: '',
          description: ''
        });
        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '/admin/subjects';
        }, 2000);
      } else {
        setError(data.message || 'Failed to create subject');
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      setError('Failed to create subject. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} navItems={navItems} />
      
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Subject</h1>
            <p className="text-gray-600 mt-2">Add a new subject to the school curriculum</p>
          </div>
          <Button
            onClick={() => window.location.href = '/admin/subjects'}
            variant="secondary"
            testId="back-to-subjects-btn"
          >
            ← Back to Subjects
          </Button>
        </div>

        {/* Form */}
        <Card title="Subject Information" testId="subject-form-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">{success}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Mathematics, English, Science"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="subject-name-input"
                  required
                />
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., MATH, ENG, SCI"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="subject-code-input"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Short code for the subject (max 10 characters)</p>
              </div>

              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level
                </label>
                <select
                  id="gradeLevel"
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="grade-level-select"
                >
                  <option value="">Select Grade Level</option>
                  <option value="0">All Grades</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Status
                </label>
                <div className="bg-green-50 px-3 py-2 rounded-md">
                  <span className="text-sm text-green-700">Active (will be available for assignment)</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Brief description of the subject..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="subject-description-input"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                onClick={() => window.location.href = '/admin/subjects'}
                variant="secondary"
                testId="cancel-btn"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                testId="create-subject-btn"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Subject'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Information Card */}
        <div className="mt-8">
          <Card title="Important Information" testId="info-card">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                <span>Once created, you can assign teachers to this subject from the Teachers management page.</span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                <span>Subject codes should be unique and easy to recognize (e.g., MATH101, ENG9).</span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                <span>Grade levels help organize subjects by academic year and curriculum standards.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}