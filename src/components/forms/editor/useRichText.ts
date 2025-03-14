import { useRef, useState, useEffect, useCallback } from 'react';

export function useRichText(onChange: (value: string) => void, editorId: string) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [styles, setStyles] = useState<string[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const updateActiveStyles = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Only update styles if the selection is within the current editor
    const range = selection.getRangeAt(0);
    const editor = document.getElementById(editorId);
    if (!editor?.contains(range.commonAncestorContainer)) return;

    const activeStyles = [];
    
    try {
      // Check if bold is active
      if (document.queryCommandState('bold')) {
        activeStyles.push('bold');
      }
      
      // Check if italic is active
      if (document.queryCommandState('italic')) {
        activeStyles.push('italic');
      }
      
      // Check if underline is active
      if (document.queryCommandState('underline')) {
        activeStyles.push('underline');
      }
      
      // Also check for HTML elements as fallback
      const parentElement = range.commonAncestorContainer.parentElement;
      if (parentElement) {
        // Check for direct style attributes
        const computedStyle = window.getComputedStyle(parentElement);
        if (computedStyle.fontWeight === 'bold' || computedStyle.fontWeight === '700') {
          activeStyles.push('bold');
        }
        if (computedStyle.fontStyle === 'italic') {
          activeStyles.push('italic');
        }
        if (computedStyle.textDecoration.includes('underline')) {
          activeStyles.push('underline');
        }

        // Check for parent elements
        let element = parentElement;
        while (element && editor.contains(element)) {
          const tagName = element.tagName.toLowerCase();
          if (tagName === 'b' || tagName === 'strong') activeStyles.push('bold');
          if (tagName === 'i' || tagName === 'em') activeStyles.push('italic');
          if (tagName === 'u') activeStyles.push('underline');
          element = element.parentElement as HTMLElement;
        }
      }
    } catch (error) {
      console.error('Error updating active styles:', error);
    }
    
    setStyles([...new Set(activeStyles)]);
  }, [editorId]);

  const toggleStyle = useCallback((style: string) => {
    const editor = document.getElementById(editorId);
    if (!editor) return;

    // Ensure the editor has focus and selection is within it
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      editor.focus();
      return;
    }
    
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      editor.focus();
      return;
    }

    const command = style === 'bold' ? 'bold' : 
                   style === 'italic' ? 'italic' : 
                   'underline';
                   
    document.execCommand(command, false);
    
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateActiveStyles();
    }
  }, [editorId, onChange, updateActiveStyles]);

  const handleImageUpload = useCallback((url: string) => {
    const editor = document.getElementById(editorId);
    if (!editor) return;
    
    editor.focus();
    document.execCommand('insertImage', false, url);
    
    if (editorRef.current) {
      // Ensure image is properly inserted
      const images = editorRef.current.getElementsByTagName('img');
      if (images.length > 0) {
        // Set some default styling for the image
        const lastImage = images[images.length - 1];
        lastImage.style.maxWidth = '100%';
        lastImage.style.height = 'auto';
        lastImage.style.display = 'block';
        lastImage.style.margin = '10px 0';
      }
      
      onChange(editorRef.current.innerHTML);
    }
  }, [editorId, onChange]);

  const removeImage = useCallback((img: HTMLImageElement) => {
    img.remove();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  useEffect(() => {
    const editor = document.getElementById(editorId);
    if (!editor) return;

    const handleSelectionChange = () => {
      updateActiveStyles();
    };

    editor.addEventListener('keyup', updateActiveStyles);
    editor.addEventListener('mouseup', updateActiveStyles);
    document.addEventListener('selectionchange', handleSelectionChange);
    editor.addEventListener('focus', updateActiveStyles);
    editor.addEventListener('click', updateActiveStyles);

    return () => {
      editor.removeEventListener('keyup', updateActiveStyles);
      editor.removeEventListener('mouseup', updateActiveStyles);
      document.removeEventListener('selectionchange', handleSelectionChange);
      editor.removeEventListener('focus', updateActiveStyles);
      editor.removeEventListener('click', updateActiveStyles);
    };
  }, [editorId, updateActiveStyles]);

  return {
    editorRef,
    showImageUpload,
    styles,
    toggleStyle,
    handleImageUpload,
    setShowImageUpload,
    removeImage
  };
}