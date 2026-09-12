import React, { useState } from 'react';
import { X, StickyNote, Trash2, ExternalLink, Search, BookOpen, Calendar } from 'lucide-react';
import { PersonalNote, BookTheme } from '../types';
import { THEME_CONFIG } from '../constants';

interface PersonalNotesModalProps {
  isOpen: boolean;
  notes: PersonalNote[];
  theme: BookTheme;
  onClose: () => void;
  onDeleteNote: (id: string) => void;
  onJumpToPage: (page: number) => void;
}

export const PersonalNotesModal: React.FC<PersonalNotesModalProps> = ({
  isOpen,
  notes,
  theme,
  onClose,
  onDeleteNote,
  onJumpToPage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const currentTheme = THEME_CONFIG[theme];

  if (!isOpen) return null;

  const filteredNotes = notes.filter(
    (n) =>
      n.noteText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.selectedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border ${currentTheme.border} ${currentTheme.card} ${currentTheme.text} transition-colors duration-200 overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8c6b2d]/10 flex items-center justify-center text-[#8c6b2d] dark:text-[#d4af37]">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-sans-ui">Notas Personales</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans-ui">
                {notes.length} {notes.length === 1 ? 'nota guardada' : 'notas guardadas'} en tus lecturas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar notas"
            className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        {notes.length > 0 && (
          <div className="px-6 py-3 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar en tus notas o fragmentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border ${currentTheme.border} ${currentTheme.surface} focus:outline-none focus:ring-2 focus:ring-[#8c6b2d] transition-all`}
              />
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-14 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#8c6b2d]/10 flex items-center justify-center text-[#8c6b2d] dark:text-[#d4af37]">
                <StickyNote className="w-8 h-8 opacity-80" />
              </div>
              <h4 className="font-serif-book font-bold text-lg mb-1">Aún no tienes notas personales</h4>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto font-sans-ui leading-relaxed">
                Selecciona cualquier fragmento de texto en el libro o haz clic en el icono de nota en los párrafos para registrar tus reflexiones.
              </p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-neutral-500 font-sans-ui">No se encontraron notas con "{searchQuery}"</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`p-4 rounded-xl border ${currentTheme.border} ${currentTheme.surface} hover:shadow-md transition-all group`}
              >
                {/* Note header meta */}
                <div className="flex items-center justify-between text-xs font-sans-ui text-neutral-500 dark:text-neutral-400 mb-2.5">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="font-bold text-[#8c6b2d] dark:text-[#d4af37]">
                      Cap. {note.chapterNumber}
                    </span>
                    <span>·</span>
                    <span className="truncate max-w-[180px] sm:max-w-xs">{note.chapterTitle}</span>
                    <span>·</span>
                    <span>Pág. {note.page}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] opacity-75">
                      <Calendar className="w-3 h-3" />
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                      title="Eliminar nota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Selected Fragment Quote */}
                {note.selectedText && (
                  <blockquote className="border-l-2 border-[#8c6b2d] pl-3 py-1 my-2 text-xs italic font-serif-book opacity-85 bg-black/[0.02] dark:bg-white/[0.02] rounded-r-lg">
                    "{note.selectedText}"
                  </blockquote>
                )}

                {/* Note text */}
                <div className="mt-2 text-xs sm:text-sm font-sans-ui whitespace-pre-wrap leading-relaxed bg-black/5 dark:bg-white/5 p-3 rounded-lg">
                  {note.noteText}
                </div>

                {/* Jump to page button */}
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onJumpToPage(note.page);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#8c6b2d] hover:bg-[#775a24] text-white text-xs font-sans-ui font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Ir a página {note.page}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-black/10 dark:border-white/10 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-xs font-sans-ui font-semibold cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
