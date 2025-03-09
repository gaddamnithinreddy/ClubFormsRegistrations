export function validateImageFile(file: File): { isValid: boolean; error: string | null } {
  const MAX_SIZE_MB = 5;
  const fileSizeInMB = file.size / (1024 * 1024);

  if (fileSizeInMB > MAX_SIZE_MB) {
    return {
      isValid: false,
      error: `Image size must be less than ${MAX_SIZE_MB}MB`
    };
  }

  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'Please select a valid image file'
    };
  }

  return { isValid: true, error: null };
}