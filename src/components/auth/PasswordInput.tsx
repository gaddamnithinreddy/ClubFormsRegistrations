import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function PasswordInput({ id, value, onChange, label }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          style={{ paddingRight: '2.5rem' }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3"
        >
          {!showPassword ? (
            <EyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}