'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';

interface NewSchoolData {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export default function NewSchoolPage() {
  const [formData, setFormData] = useState<NewSchoolData>({
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const router = useRouter();

  const navItems = [
    { label: 'Dashboard', href: '/superadmin', testId: 'nav-dashboard' },
    { label: 'Schools', href: '/superadmin/schools', testId: 'nav-schools' },
    { label: 'Reports', href: '/superadmin/reports', testId: 'nav-reports' }
  ];

  const user = {
    username: 'Superadmin',
    role: 'superadmin'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/superadmin/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessData(data.school);
      } else {
        setError(data.message || 'Failed to create school');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/superadmin');
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} navItems={navItems} />
        
        <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Card title="School Created Successfully" testId="success-card">
            <div className="text-center mb-6">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {successData.name} has been registered!
              </h2>
              <p className="text-gray-600">The school has been created with admin credentials.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="font-bold text-lg mb-4">Admin Login Credentials:</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Username:</span>
                  <span className="text-primary font-mono" data-testid="admin-username">
                    {successData.adminUsername}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Password:</span>
                  <span className="text-error font-mono" data-testid="admin-password">
                    {successData.adminPassword}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm">
                  <strong>Important:</strong> Please save these credentials securely. 
                  The password cannot be retrieved again.
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={handleBackToDashboard}
                testId="back-to-dashboard-btn"
                className="flex-1"
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={() => setSuccessData(null)}
                variant="secondary"
                testId="create-another-btn"
                className="flex-1"
              >
                Create Another School
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
      
      <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Register New School</h1>
          <p className="text-gray-600 mt-2">Create a new school with admin credentials</p>
        </div>

        <Card testId="new-school-form">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" data-testid="error-message">
                {error}
              </div>
            )}

            <Input
              label="School Name"
              type="text"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="Enter school name"
              required
              testId="school-name-input"
            />

            <Input
              label="Address"
              type="text"
              value={formData.address}
              onChange={(value) => setFormData({ ...formData, address: value })}
              placeholder="Enter school address"
              testId="school-address-input"
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              placeholder="Enter phone number"
              testId="school-phone-input"
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              placeholder="Enter email address"
              testId="school-email-input"
            />

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleBackToDashboard}
                testId="cancel-btn"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                testId="create-school-btn"
                className="flex-1"
              >
                Create School
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}