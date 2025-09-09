'use client';

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  loading?: boolean;
  testId: string;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  testId,
  className = ''
}) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary text-white border-primary hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-white text-secondary border-secondary hover:bg-gray-50 focus:ring-secondary',
    danger: 'bg-error text-white border-error hover:bg-red-700 focus:ring-error',
    success: 'bg-success text-white border-success hover:bg-green-700 focus:ring-success'
  };
  
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  
  const buttonClasses = `
    ${baseClasses} 
    ${variantClasses[variant]} 
    ${disabled || loading ? disabledClasses : ''} 
    ${className}
  `.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={testId}
      className={buttonClasses}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;