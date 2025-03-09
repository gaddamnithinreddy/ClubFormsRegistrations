import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CalendarButton } from '../calendar/CalendarButton';
import { sanitizeHtml } from '../../lib/utils/sanitize';

interface SubmissionSuccessProps {
  formTitle: string;
  formDescription: string;
  eventDate?: string;
  eventLocation?: string;
  eventEndTime?: string;
}

export function SubmissionSuccess({
  formTitle,
  formDescription,
  eventDate,
  eventLocation,
  eventEndTime
}: SubmissionSuccessProps) {
  const navigate = useNavigate();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/auth');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const showCalendarButton = eventDate && new Date(eventDate) > new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full animate-scale-up">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400 animate-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Response Submitted!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Thank you for your submission</p>
          
          {showCalendarButton && (
            <div className="mt-4 w-full">
              <CalendarButton
                event={{
                  title: formTitle,
                  description: sanitizeHtml(formDescription),
                  location: eventLocation,
                  startTime: eventDate,
                  endTime: eventEndTime
                }}
              />
            </div>
          )}

          <p className="text-sm text-gray-500 mt-4">
            Redirecting to login page in a few seconds...
          </p>
        </div>
      </div>
    </div>
  );
}