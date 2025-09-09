'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from './Button';

interface NavItem {
  label: string;
  href: string;
  testId: string;
}

interface NavbarProps {
  user?: {
    username: string;
    role: string;
  };
  navItems: NavItem[];
}

const Navbar: React.FC<NavbarProps> = ({ user, navItems }) => {
  const router = useRouter();

  const handleLogout = () => {
    // Clear tokens from localStorage and cookies
    localStorage.removeItem('token');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  return (
    <nav className="nav-header bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-xl font-bold text-primary" data-testid="logo">
            School.com
          </Link>
          <div className="hidden md:flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
                data-testid={item.testId}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Welcome, <span className="font-medium">{user.username}</span>
              <span className="ml-1 px-2 py-1 bg-primary text-white text-xs rounded-full uppercase">
                {user.role}
              </span>
            </span>
            <Button
              onClick={handleLogout}
              variant="secondary"
              testId="logout-btn"
              className="text-sm"
            >
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;