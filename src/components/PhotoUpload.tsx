import { useRef, useState } from 'react';

interface PhotoUploadProps {
  onPhotoSelected: (dataUrl: string) => void;
}

export function PhotoUpload({ onPhotoSelected }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onPhotoSelected(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative cursor-pointer min-h-[60vh] md:min-h-[70vh]
          flex flex-col items-center justify-center
          bg-gradient-to-b from-warm/30 to-cream
          transition-all duration-300
          ${isDragging ? 'bg-accent-light/40 scale-[1.01]' : 'hover:bg-warm/40'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-8">
          {/* Large tap target */}
          <div
            className={`
              w-24 h-24 md:w-32 md:h-32 rounded-full
              flex items-center justify-center
              transition-all duration-300
              ${isDragging
                ? 'bg-accent text-white scale-110'
                : 'bg-white shadow-lg hover:shadow-xl hover:scale-105 border border-warm'
              }
            `}
          >
            <svg
              className={`w-10 h-10 md:w-12 md:h-12 ${isDragging ? 'text-white' : 'text-accent'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>

          {/* Minimal text */}
          <div className="text-center">
            <p className="font-display text-2xl md:text-3xl font-semibold text-ink">
              Photograph your space
            </p>
            <p className="text-ink/50 mt-2 text-sm">
              or drag and drop an image
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
