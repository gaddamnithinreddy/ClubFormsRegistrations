import { useRef, useState, useEffect, useCallback } from 'react';

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
    
    // Check for direct style attributes and HTML tags
    let element = parentElement;
    while (element && editor.contains(element)) {
      const style = window.getComputedStyle(element);
      if (style.fontWeight === 'bold' || style.fontWeight === '700' || element.tagName.toLowerCase() === 'b' || element.tagName.toLowerCase() === 'strong') {
        activeStyles.push('bold');
      }
      if (style.fontStyle === 'italic' || element.tagName.toLowerCase() === 'i' || element.tagName.toLowerCase() === 'em') {
        activeStyles.push('italic');
      }
      if (style.textDecoration.includes('underline') || element.tagName.toLowerCase() === 'u') {
        activeStyles.push('underline');
      }
      element = element.parentElement as HTMLElement;
    }
    
    setStyles([...new Set(activeStyles)]);
  }, [editorId]);

  const toggleStyle = useCallback((style: string) => {
    const editor = document.getElementById(editorId);
    if (!editor) return;

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

    let command = '';
    let tag = '';
    
    switch (style) {
      case 'bold':
        command = 'bold';
        tag = 'strong';
        break;
      case 'italic':
        command = 'italic';
        tag = 'em';
        break;
      case 'underline':
        command = 'underline';
        tag = 'u';
        break;
      default:
        return;
    }

    // Try execCommand first
    if (document.execCommand(command, false)) {
      // Success, update content
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
        updateActiveStyles();
      }
      return;
    }

    // Fallback: Manual tag wrapping
    const fragment = range.extractContents();
    const element = document.createElement(tag);
    element.appendChild(fragment);
    range.insertNode(element);
    
    // Restore selection
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(element);
    selection.addRange(newRange);

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateActiveStyles();
    }
  }, [editorId, onChange, updateActiveStyles]);

  const handleImageUpload = useCallback((url: string) => {
    const editor = document.getElementById(editorId);
    if (!editor) return;

    // Create container for image and delete button
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'inline-block';
    container.style.maxWidth = '100%';
    container.style.marginBottom = '8px';

    // Create image element
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Uploaded image';
    img.style.maxWidth = '100%';
    img.style.display = 'block';

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '×'; // Using × character for cross mark
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '4px';
    deleteBtn.style.right = '4px';
    deleteBtn.style.width = '20px';
    deleteBtn.style.height = '20px';
    deleteBtn.style.padding = '0';
    deleteBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    deleteBtn.style.color = 'white';
    deleteBtn.style.border = 'none';
    deleteBtn.style.borderRadius = '50%';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.display = 'flex';
    deleteBtn.style.alignItems = 'center';
    deleteBtn.style.justifyContent = 'center';
    deleteBtn.style.fontSize = '16px';
    deleteBtn.style.lineHeight = '1';
    deleteBtn.style.transition = 'background-color 0.2s';
    
    // Add hover effect
    deleteBtn.addEventListener('mouseover', () => {
      deleteBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    });
    deleteBtn.addEventListener('mouseout', () => {
      deleteBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    });

    // Add delete functionality
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent editor from losing focus
      container.remove();
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    });

    // Assemble container
    container.appendChild(img);
    container.appendChild(deleteBtn);
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount) {
      const range = selection.getRangeAt(0);
      range.insertNode(container);
      
      // Add a line break after the container
      const br = document.createElement('br');
      range.setStartAfter(container);
      range.setEndAfter(container);
      range.insertNode(br);
      
      // Move cursor to the next line
      range.setStartAfter(br);
      range.setEndAfter(br);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Focus the editor
      editor.focus();
    } else {
      editor.appendChild(container);
      const br = document.createElement('br');
      editor.appendChild(br);
      
      // Move cursor to the end
      const range = document.createRange();
      range.setStartAfter(br);
      range.setEndAfter(br);
      selection?.removeAllRanges();
      selection?.addRange(range);
      editor.focus();
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [editorId, onChange]);

  useEffect(() => {
    const editor = document.getElementById(editorId);
    if (!editor) return;

    const handleSelectionChange = () => {
      updateActiveStyles();
    };

    editor.addEventListener('keyup', updateActiveStyles);
    editor.addEventListener('mouseup', updateActiveStyles);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      editor.removeEventListener('keyup', updateActiveStyles);
      editor.removeEventListener('mouseup', updateActiveStyles);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [editorId, updateActiveStyles]);

  return {
    editorRef,
    showImageUpload,
    styles,
    toggleStyle,
    handleImageUpload,
    setShowImageUpload
  };
}