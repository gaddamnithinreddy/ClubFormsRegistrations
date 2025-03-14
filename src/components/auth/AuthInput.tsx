import React from 'react';

interface AuthInputProps {
  id: string;
  type: 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  label: string;
  icon?: boolean;
  placeholder?: string;
}

export function AuthInput({ id, type, value, onChange, label, icon = false, placeholder = '' }: AuthInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
          icon ? 'pl-10' : 'px-3'
        } py-2`}
      />
    </div>
  );
}