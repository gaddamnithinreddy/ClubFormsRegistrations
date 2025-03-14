export function formatDateForDB(dateString: string): string {
  // Ensure the date is in UTC format for database storage
  const date = new Date(dateString);
  return date.toISOString();
}

export function formatDateForDisplay(dateString: string): string {
  // Format date for display in user's local timezone
  const date = new Date(dateString);
  return date.toLocaleString();
}