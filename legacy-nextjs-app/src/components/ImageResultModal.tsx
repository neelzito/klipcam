'use client';

import { X, Download, ExternalLink } from 'lucide-react';

interface ImageResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  title?: string;
  jobId?: string;
}

export function ImageResultModal({ isOpen, onClose, imageUrl, title = "Generated Image", jobId }: ImageResultModalProps) {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `klipcam-generated-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInTab = () => {
    window.open(imageUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {jobId && <p className="text-sm text-gray-400">Job ID: {jobId}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image */}
        <div className="relative max-h-[60vh] overflow-auto">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-auto max-w-full"
            loading="lazy"
          />
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-700 flex gap-3 justify-end">
          <button
            onClick={handleOpenInTab}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ExternalLink size={16} />
            Open in Tab
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}