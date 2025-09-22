'use client';

import React from 'react';

interface TimeInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  testId: string;
  error?: string;
  warning?: string;
  className?: string;
}

const TimeInput: React.FC<TimeInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  testId,
  error,
  warning,
  className = ''
}) => {
  // Set default time to 08:00 AM if empty
  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  // Generate common time options (7 AM to 6 PM in 1-hour intervals)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 7; hour <= 18; hour++) {
      const time24 = `${hour.toString().padStart(2, '0')}:00`;
      options.push(time24);
      
      // Add 30-minute intervals for common class times
      const time24Half = `${hour.toString().padStart(2, '0')}:30`;
      options.push(time24Half);
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="form-label text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        required={required}
        disabled={disabled}
        data-testid={testId}
        className={`form-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
          error ? 'border-red-500' : warning ? 'border-yellow-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">{placeholder || 'Select time'}</option>
        {timeOptions.map((time) => {
          const [hour, minute] = time.split(':');
          const hour12 = parseInt(hour) > 12 ? parseInt(hour) - 12 : parseInt(hour) === 0 ? 12 : parseInt(hour);
          const ampm = parseInt(hour) >= 12 ? 'PM' : 'AM';
          const displayTime = `${hour12}:${minute} ${ampm}`;
          
          return (
            <option key={time} value={time}>
              {displayTime}
            </option>
          );
        })}
      </select>
      
      {warning && (
        <p className="mt-1 text-sm text-yellow-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {warning}
        </p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default TimeInput;