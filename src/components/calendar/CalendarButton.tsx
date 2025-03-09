import React from 'react';
import { Calendar } from 'lucide-react';

interface CalendarEvent {
  title: string;
  description: string;
  location?: string;
  startTime: string;
  endTime?: string;
}

interface CalendarButtonProps {
  event: CalendarEvent;
}

export function CalendarButton({ event }: CalendarButtonProps) {
  const generateGoogleCalendarUrl = () => {
    // Parse dates and ensure they're in the correct timezone
    const startDate = new Date(event.startTime);
    const endDate = event.endTime 
      ? new Date(event.endTime)
      : new Date(startDate.getTime() + 60 * 60 * 1000); // Default to 1 hour duration

    const formatDate = (date: Date) => {
      // Format date in UTC to avoid timezone issues
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      details: event.description,
      location: event.location || '',
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      ctz: Intl.DateTimeFormat().resolvedOptions().timeZone // Add timezone
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const generateICSFile = () => {
    const startDate = new Date(event.startTime);
    const endDate = event.endTime 
      ? new Date(event.endTime)
      : new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDateForICS = (date: Date) => {
      return date.toISOString().replace(/[-:.]|\.\d{3}/g, '').slice(0, -1);
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      event.location ? `LOCATION:${event.location}` : '',
      `DTSTART:${formatDateForICS(startDate)}`,
      `DTEND:${formatDateForICS(endDate)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-2">
      <a
        href={generateGoogleCalendarUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <Calendar className="w-5 h-5" />
        Add to Google Calendar
      </a>
      <button
        onClick={generateICSFile}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
      >
        <Calendar className="w-5 h-5" />
        Download for Other Calendars
      </button>
    </div>
  );
}