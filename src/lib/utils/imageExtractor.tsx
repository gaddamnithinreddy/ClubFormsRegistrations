import React from 'react';
import { sanitizeHtml } from './sanitize';

/**
 * Extracts image URLs from HTML content
 * @param html The HTML content to extract images from
 * @returns Array of unique image URLs
 */
export function extractImagesFromHtml(html: string | undefined): string[] {
  if (!html) return [];
  
  try {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizeHtml(html);
    
    // Get all image elements
    const imgElements = tempDiv.querySelectorAll('img');
    
    // Extract and deduplicate image URLs using a Set
    const uniqueUrls = new Set<string>();
    
    imgElements.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && src.trim() !== '') {
        uniqueUrls.add(src);
      }
    });
    
    return Array.from(uniqueUrls);
  } catch (error) {
    console.error('Error extracting images from HTML:', error);
    return [];
  }
}

/**
 * Extracts image elements from HTML content
 * @param html The HTML content to extract images from
 * @returns Array of image elements
 */
export function extractImageElements(html: string | undefined): HTMLImageElement[] {
  if (!html) return [];
  
  try {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizeHtml(html);
    
    // Get all image elements
    const imgElements = tempDiv.querySelectorAll('img');
    
    // Convert NodeList to array
    return Array.from(imgElements);
  } catch (error) {
    console.error('Error extracting image elements from HTML:', error);
    return [];
  }
}

// For backward compatibility, create an alias to the new function name
export const extractImageElementsFromHtml = extractImageElements;

interface ExtractedImagesProps {
  html: string | undefined;
  maxHeight?: number;
  maxImages?: number;
  containerClassName?: string;
  imageClassName?: string;
  showMoreIndicator?: boolean;
  altPrefix?: string;
}

/**
 * Component to render extracted images from HTML content
 */
export function ExtractedImages({ 
  html, 
  maxHeight = 200,
  maxImages = Infinity,
  containerClassName = '',
  imageClassName = '',
  showMoreIndicator = false,
  altPrefix = 'Image'
}: ExtractedImagesProps): React.ReactNode {
  // Only extract images that are not already in img tags
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitizeHtml(html || '');
  
  // Remove any img tags that are already in preview containers
  const previewContainers = tempDiv.querySelectorAll('.image-preview-container');
  previewContainers.forEach(container => container.remove());
  
  const images = extractImagesFromHtml(tempDiv.innerHTML);
  
  if (images.length === 0) {
    return null;
  }
  
  // Limit the number of images to display
  const displayImages = images.slice(0, maxImages);
  const hasMore = images.length > maxImages;
  
  return (
    <div className={`flex flex-wrap gap-2 ${containerClassName}`}>
      {displayImages.map((src, index) => (
        <div 
          key={`${src}-${index}`} 
          className="image-preview-container border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-white dark:bg-gray-800 inline-block"
        >
          <img
            src={src}
            alt={`${altPrefix} ${index + 1}`}
            className={`max-w-full rounded-lg object-contain ${imageClassName}`}
            style={{ maxHeight: `${maxHeight}px` }}
            onError={(e) => {
              console.error('Image failed to load:', src);
              e.currentTarget.style.display = 'none';
            }}
            loading="lazy"
          />
        </div>
      ))}
      
      {hasMore && showMoreIndicator && (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          +{images.length - maxImages} more
        </div>
      )}
    </div>
  );
}
