'use client';

import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  testId
}) => {
  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
      data-testid={testId}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );
};

export default Card;