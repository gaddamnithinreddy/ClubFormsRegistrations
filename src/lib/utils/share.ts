import { isWebShareSupported } from './browser';

interface ShareOptions {
  title?: string;
  text?: string;
  url: string;
}

export async function shareContent({ title, text, url }: ShareOptions): Promise<boolean> {
  try {
    // Check if Web Share API is supported and available
    if (isWebShareSupported()) {
      await navigator.share({
        title: title || document.title,
        text: text || '',
        url
      });
      return true;
    }
    return false;
  } catch (error) {
    // Don't throw on user cancellation
    if (error instanceof Error && error.name === 'AbortError') {
      return false;
    }
    // Don't throw on permission errors, just return false
    if (error instanceof Error && error.name === 'NotAllowedError') {
      return false;
    }
    throw error;
  }
}