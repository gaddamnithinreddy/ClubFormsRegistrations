import React from 'react';
import { Calendar } from 'lucide-react';

interface GoogleCalendarButtonProps {
  title: string;
  description: string;
  startDate: string;
  location?: string;
}

export function GoogleCalendarButton({ title, description, startDate, location = '' }: GoogleCalendarButtonProps) {
  const createGoogleCalendarUrl = () => {
    const date = new Date(startDate);
    // Create end date 1 hour after start date
    const endDate = new Date(date.getTime() + (60 * 60 * 1000));
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const eventDetails = {
      text: title,
      details: description,
      location,
      dates: `${formatDate(date)}/${formatDate(endDate)}`,
    };

    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams({
      text: eventDetails.text,
      details: eventDetails.details,
      location: eventDetails.location,
      dates: eventDetails.dates,
    });

    return `${baseUrl}&${params.toString()}`;
  };

  return (
    <a
      href={createGoogleCalendarUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <Calendar className="w-5 h-5" />
      Add to Google Calendar
    </a>
  );
}