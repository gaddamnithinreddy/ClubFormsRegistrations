import React, { useRef, useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';
import { isValidUrl } from '../../../lib/utils/url';

interface QRCodeShareProps {
  url: string;
}

export function QRCodeShare({ url }: QRCodeShareProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [isValidQRUrl, setIsValidQRUrl] = useState(true);

  useEffect(() => {
    setIsValidQRUrl(isValidUrl(url));
  }, [url]);

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    
    try {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'form-qr-code.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  if (!isValidQRUrl) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
        <p className="text-red-500">Invalid URL for QR code generation</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg flex flex-col items-center">
      <div ref={qrRef} className="bg-white p-4 rounded-lg">
        <QRCodeCanvas
          value={url}
          size={200}
          level="H"
          includeMargin
          className="max-w-full h-auto"
        />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 mb-4">Scan to open form</p>
      <button
        onClick={downloadQRCode}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        <Download size={18} />
        Download QR Code
      </button>
    </div>
  );
}