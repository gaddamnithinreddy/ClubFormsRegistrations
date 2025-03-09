import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { shareContent } from '../../../lib/utils/share';

interface URLShareProps {
  url: string;
}

export function URLShare({ url }: URLShareProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    try {
      const shared = await shareContent({
        title: 'Form Share',
        url: url
      });
      
      // Fallback to copy if sharing is not supported or fails
      if (!shared) {
        await copyToClipboard();
      }
    } catch (err) {
      console.error('Share failed, falling back to copy:', err);
      await copyToClipboard();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={url}
          readOnly
          className="w-full pr-32 py-2 pl-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          <button
            onClick={handleShare}
            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}