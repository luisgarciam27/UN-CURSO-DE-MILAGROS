import React, { useState } from 'react';
import { X, StickyNote, Check, BookOpen } from 'lucide-react';
import { BookTheme } from '../types';
import { THEME_CONFIG } from '../constants';

interface AddNoteModalProps {
  isOpen: boolean;
  selectedText: string;
  page: number;
  chapterNumber: number;
  chapterTitle: string;
  theme: BookTheme;
  onClose: () => void;
  onSaveNote: (noteText: string, selectedText: string, page: number) => void;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  selectedText,
  page,
  chapterNumber,
  chapterTitle,
  theme,
  onClose,
  onSaveNote,
}) => {
  const [noteText, setNoteText] = useState('');
  const currentTheme = THEME_CONFIG[theme];

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onSaveNote(noteText.trim(), selectedText, page);
    setNoteText('');
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-2xl shadow-2xl border ${currentTheme.border} ${currentTheme.card} ${currentTheme.text} transition-colors duration-200 overflow-hidden`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#8c6b2d]/10 flex items-center justify-center text-[#8c6b2d] dark:text-[#d4af37]">
              <StickyNote className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-sans-ui">Nueva Nota Personal</h3>
              <p className="text-[11px] text-neutral-500 font-sans-ui">
                Cap. {chapterNumber} · Pág. {page}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {selectedText && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5 block">
                Fragmento seleccionado:
              </label>
              <blockquote className="border-l-2 border-[#8c6b2d] pl-3 py-1.5 text-xs italic font-serif-book opacity-85 bg-black/[0.03] dark:bg-white/[0.03] rounded-r-lg max-h-24 overflow-y-auto">
                "{selectedText}"
              </blockquote>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5 block">
              Tu Nota o Reflexión:
            </label>
            <textarea
              rows={4}
              required
              autoFocus
              placeholder="Escribe tu nota, pensamiento o revelación sobre este fragmento..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className={`w-full p-3 rounded-xl text-xs sm:text-sm border ${currentTheme.border} ${currentTheme.surface} focus:outline-none focus:ring-2 focus:ring-[#8c6b2d] transition-all`}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs font-sans-ui font-semibold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!noteText.trim()}
              className="px-5 py-2 rounded-xl bg-[#8c6b2d] hover:bg-[#775a24] disabled:opacity-40 text-white text-xs font-sans-ui font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Nota</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
