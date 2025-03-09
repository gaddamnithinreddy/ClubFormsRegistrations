export function validateEmail(email: string): string | null {
  if (!email) {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  if (email.length > 254) {
    return 'Email address is too long';
  }

  const [localPart, domain] = email.split('@');
  if (localPart.length > 64) {
    return 'Email username is too long';
  }
  
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  if (password.length > 128) {
    return 'Password is too long';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  
  return null;
}

export function validateDate(date: string): string | null {
  if (!date) {
    return 'Date is required';
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Please enter a valid date';
  }

  const now = new Date();
  if (dateObj < now) {
    return 'Date cannot be in the past';
  }

  // Check if date is too far in the future (e.g., 10 years)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 10);
  if (dateObj > maxDate) {
    return 'Date cannot be more than 10 years in the future';
  }

  return null;
}

export function validateDateRange(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) {
    return 'Both start and end dates are required';
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Please enter valid dates';
  }

  if (end <= start) {
    return 'End date must be after start date';
  }

  const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (diffInHours > 24 * 365) { // More than 1 year
    return 'Date range cannot exceed 1 year';
  }

  return null;
}

export function validateFileSize(file: File, maxSizeMB: number): string | null {
  if (!file) {
    return 'File is required';
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `File size must be less than ${maxSizeMB}MB`;
  }

  if (file.size === 0) {
    return 'File cannot be empty';
  }

  return null;
}

export function validateFileType(file: File, allowedTypes: string[]): string | null {
  if (!file) {
    return 'File is required';
  }

  const fileType = file.type.toLowerCase();
  if (!fileType) {
    return 'File type cannot be determined';
  }

  if (!allowedTypes.includes(fileType)) {
    return `File type must be one of: ${allowedTypes.join(', ')}`;
  }

  return null;
}

export function validateURL(url: string): string | null {
  if (!url) {
    return 'URL is required';
  }

  try {
    new URL(url);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
}

export function validatePhoneNumber(phone: string): string | null {
  if (!phone) {
    return 'Phone number is required';
  }

  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }

  return null;
}