import React from 'react';
import { RichTextEditor } from './RichTextEditor';

interface FormHeaderProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function FormHeader({
  title,
  description,
  onTitleChange,
  onDescriptionChange
}: FormHeaderProps) {
  return (
    <div className="space-y-4">
      <RichTextEditor
        label="Form Title"
        value={title}
        onChange={onTitleChange}
        placeholder="Enter form title"
        required
        enableRichText={true}
      />
      
      <RichTextEditor
        label="Description"
        value={description}
        onChange={onDescriptionChange}
        placeholder="Enter form description"
        multiline
        enableRichText={true}
      />
    </div>
  );
}