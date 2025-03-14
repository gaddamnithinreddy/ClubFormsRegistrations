export type FormField = {
  id: string;
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'multiselect' | 'image';
  label: string;
  required: boolean;
  options?: string[];
  styles?: string[];
  image?: string;
};

export interface FormData {
  title: string;
  description: string;
  event_date: string;
  event_location?: string;
  event_end_time?: string;
  banner_image?: string;
  fields: FormField[];
  accepting_responses?: boolean;
}

export interface Form extends FormData {
  id: string;
  created_by: string;
  created_at: string;
  accepting_responses: boolean;
}

export interface FormResponse {
  id: string;
  form_id: string;
  user_id: string;
  responses: Record<string, any>;
  submitted_at: string;
}

export type UserRole = 'president' | 'audience' | null;