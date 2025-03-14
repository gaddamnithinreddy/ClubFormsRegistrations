/*
  # Add cascade deletion for form responses
  
  1. Changes
    - Add ON DELETE CASCADE to form_responses foreign key
    - This ensures responses are automatically deleted when a form is deleted
*/

ALTER TABLE form_responses 
DROP CONSTRAINT IF EXISTS fk_form;

ALTER TABLE form_responses
ADD CONSTRAINT fk_form 
FOREIGN KEY (form_id) 
REFERENCES forms(id) 
ON DELETE CASCADE;