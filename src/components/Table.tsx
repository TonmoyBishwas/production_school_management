'use client';

import React from 'react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface TableProps {
  columns: Column[];
  data: Record<string, any>[];
  onRowClick?: (row: Record<string, any>) => void;
  testId: string;
  className?: string;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  onRowClick,
  testId,
  className = ''
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="data-table w-full" data-testid={testId}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500 border border-gray-200">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={index}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                onClick={() => onRowClick?.(row)}
                data-testid={`${testId}-row-${index}`}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                    {row[column.key] !== null && row[column.key] !== undefined 
                      ? String(row[column.key]) 
                      : 'N/A'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;