import { useRef, useState, useCallback } from 'react';

export function useRichText(onChange: (value: string) => void, editorId: string) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [styles, setStyles] = useState<string[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const updateActiveStyles = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const editor = document.getElementById(editorId);
    if (!editor?.contains(range.commonAncestorContainer)) return;

    const parentElement = range.commonAncestorContainer.parentElement;
    if (!parentElement) return;

    const activeStyles = [];
    
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

    let element = parentElement;
    while (element && editor.contains(element)) {
      const tagName = element.tagName.toLowerCase();
      if (tagName === 'b' || tagName === 'strong') activeStyles.push('bold');
      if (tagName === 'i' || tagName === 'em') activeStyles.push('italic');
      if (tagName === 'u') activeStyles.push('underline');
      element = element.parentElement as HTMLElement;
    }
    
    setStyles([...new Set(activeStyles)]);
  }, [editorId]);

  const toggleStyle = useCallback((style: string) => {
    const editor = document.getElementById(editorId);
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
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
    document.execCommand('insertImage', false, url);
    if (editorRef.current) {
      // Move cursor after the inserted image
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const removeImage = useCallback((img: HTMLImageElement) => {
    img.remove();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

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