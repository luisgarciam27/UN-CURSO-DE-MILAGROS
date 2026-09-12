import React, { useRef, useState } from 'react';
import { FileUp, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { BOOK_TITLE } from '../constants';

interface FileUploadFallbackProps {
  errorMessage: string;
  onFileSelect: (file: File) => void;
  onRetry: () => void;
}

export const FileUploadFallback: React.FC<FileUploadFallbackProps> = ({
  errorMessage,
  onFileSelect,
  onRetry,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      onFileSelect(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f7f5f0] dark:bg-[#121417] text-[#2c2925] dark:text-[#e4e1d9]">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#171a22] border border-[#e2dccf] dark:border-[#2a303d] shadow-xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#8c6b2d]/10 dark:bg-[#d4af37]/15 flex items-center justify-center mx-auto mb-4 text-[#8c6b2d] dark:text-[#d4af37]">
          <BookOpen className="w-7 h-7" />
        </div>

        <h2 className="text-xl sm:text-2xl font-display font-semibold mb-2">
          {BOOK_TITLE}
        </h2>

        <p className="text-sm font-sans-ui text-[#6d6659] dark:text-[#a19b8e] mb-6">
          Para iniciar la lectura interactiva, el lector intentó cargar automáticamente <code className="font-semibold px-1.5 py-0.5 rounded-sm bg-[#eee9dc] dark:bg-[#202530]">UCDM_Texto.pdf</code>.
        </p>

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-sans-ui flex items-center gap-2.5 text-left">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-[#8c6b2d] bg-[#f2ebd9] dark:border-[#d4af37] dark:bg-[#232a36]'
              : 'border-[#d8d1c2] dark:border-[#313745] hover:border-[#8c6b2d] dark:hover:border-[#d4af37] bg-[#faf8f4] dark:bg-[#13161c]'
          }`}
        >
          <FileUp className="w-8 h-8 text-[#8c6b2d] dark:text-[#d4af37]" />
          <div>
            <span className="font-sans-ui text-sm font-semibold text-[#2c2925] dark:text-white">
              Arrastra tu archivo UCDM_Texto.pdf aquí
            </span>
            <p className="text-xs font-sans-ui text-[#80786b] dark:text-[#8d8679] mt-1">
              o haz clic para seleccionarlo desde tu dispositivo
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleChange}
            className="hidden"
          />
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ede7da] dark:bg-[#202530] hover:bg-[#e4ddcc] dark:hover:bg-[#272e3c] text-xs font-sans-ui font-medium text-[#443f36] dark:text-[#cfc9be] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar carga automática</span>
          </button>
        </div>
      </div>
    </div>
  );
};
