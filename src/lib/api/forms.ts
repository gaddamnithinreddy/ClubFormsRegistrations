import { supabase } from '../supabase';

export async function deleteForm(formId: string): Promise<Error | null> {
  try {
    // First delete all responses associated with the form
    const { error: responsesError } = await supabase
      .from('form_responses')
      .delete()
      .eq('form_id', formId);

    if (responsesError) throw responsesError;

    // Then delete the form itself
    const { error: formError } = await supabase
      .from('forms')
      .delete()
      .eq('id', formId);

    if (formError) throw formError;
    
    return null;
  } catch (error) {
    console.error('Error deleting form:', error);
    return error as Error;
  }
}