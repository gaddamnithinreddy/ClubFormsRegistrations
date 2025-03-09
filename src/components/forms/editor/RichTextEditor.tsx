import React, { useRef, useEffect, useCallback } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { useRichText } from './useRichText';
import { ImageUploader } from './ImageUploader';

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  enableRichText?: boolean;
  editorId?: string;
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  required,
  multiline,
  enableRichText = false,
  editorId = `editor-${Math.random().toString(36).substr(2, 9)}`
}: RichTextEditorProps) {
  const {
    editorRef,
    showImageUpload,
    styles,
    toggleStyle,
    handleImageUpload,
    setShowImageUpload
  } = useRichText(onChange, editorId);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    if (content !== value) {
      onChange(content);
    }
  }, [onChange, value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
    }
  }, [multiline]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="border rounded-lg dark:border-gray-600 overflow-hidden">
        {enableRichText && (
          <EditorToolbar
            styles={styles}
            onStyleToggle={toggleStyle}
            onImageClick={() => setShowImageUpload(true)}
            editorId={editorId}
          />
        )}

        <div
          ref={editorRef}
          id={editorId}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className={`px-3 py-2 focus:outline-none dark:bg-gray-700 dark:text-white ${
            multiline ? 'min-h-[100px]' : 'min-h-[40px]'
          }`}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
      </div>

      {enableRichText && showImageUpload && (
        <ImageUploader
          onUpload={handleImageUpload}
          onClose={() => setShowImageUpload(false)}
        />
      )}
    </div>
  );
}