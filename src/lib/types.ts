export type FormField = {
  id: string;
  type: 'text' | 'number' | 'email' | 'textarea' | 'dropdown' | 'multiselect' | 'checkbox' | 'image';
  label: string;
  required: boolean;
  options?: string[];
  styles?: string[];
};

export interface FormData {
  title: string;
  description: string;
  eventDate: string;
  eventEndTime: string;
  eventLocation: string;
  fields: FormField[];
  accepting_responses?: boolean;
}

export interface Form extends Omit<FormData, 'eventDate' | 'eventEndTime' | 'eventLocation'> {
  id: string;
  created_by: string;
  created_at: string;
  event_date: string | null;
  event_end_time: string | null;
  event_location: string | null;
  accepting_responses: boolean;
}

export interface FormResponse {
  id: string;
  form_id: string;
  user_id: string;
  responses: Record<string, any>;
  submitted_at: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'audience',
  PRESIDENT = 'president'
}