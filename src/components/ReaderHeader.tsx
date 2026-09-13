import React from 'react';
import { Menu, BookOpen, FileText, Type, Volume2, Bookmark as BookmarkIcon, Search, Home, ChevronRight, Sparkles } from 'lucide-react';
import { ReaderDisplayMode, BookTheme } from '../types';
import { THEME_CONFIG, TOTAL_PAGES } from '../constants';

interface ReaderHeaderProps {
  visible: boolean;
  currentPage: number;
  chapterNumber: number;
  chapterTitle: string;
  displayMode: ReaderDisplayMode;
  theme: BookTheme;
  isBookmarked: boolean;
  isAudioActive: boolean;
  onToggleBookmark: () => void;
  onToggleDrawer: () => void;
  onToggleDisplayMode: () => void;
  onOpenTypography: () => void;
  onToggleAudio: () => void;
  onOpenSearch: () => void;
  onOpenOraciones: () => void;
  onGoHome: () => void;
  onSeekPage: (page: number) => void;
}

export const ReaderHeader: React.FC<ReaderHeaderProps> = ({
  visible,
  currentPage,
  chapterNumber,
  chapterTitle,
  displayMode,
  theme,
  isBookmarked,
  isAudioActive,
  onToggleBookmark,
  onToggleDrawer,
  onToggleDisplayMode,
  onOpenTypography,
  onToggleAudio,
  onOpenSearch,
  onOpenOraciones,
  onGoHome,
  onSeekPage,
}) => {
  const progressPercent = Math.min(100, Math.max(0, (currentPage / TOTAL_PAGES) * 100));
  const currentTheme = THEME_CONFIG[theme];

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    const targetPage = Math.max(1, Math.min(TOTAL_PAGES, Math.round(ratio * TOTAL_PAGES)));
    onSeekPage(targetPage);
  };

  return (
    <header
      id="reader-header"
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ease-out safe-top ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      } ${currentTheme.card} border-b ${currentTheme.border} ${currentTheme.text} shadow-sm backdrop-blur-md`}
    >
      <div className="max-w-7xl mx-auto px-1.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1 sm:gap-2">
        {/* Left: Drawer toggle, Inicio & Mode switcher */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            id="btn-header-menu"
            onClick={onToggleDrawer}
            aria-label="Abrir índice y marcadores"
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Índice de Capítulos y Secciones (M)"
          >
            <Menu className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>

          {/* Botón de Inicio */}
          <button
            id="btn-header-home"
            onClick={onGoHome}
            aria-label="Ir a la pantalla de Inicio"
            className="h-8 sm:h-10 px-2 sm:px-2.5 flex items-center gap-1 rounded-xl bg-[#8c6b2d]/10 hover:bg-[#8c6b2d]/20 text-[#8c6b2d] dark:text-[#d4af37] transition-all cursor-pointer text-xs font-sans-ui font-semibold active:scale-95"
            title="Ir a Inicio"
          >
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Inicio</span>
          </button>

          {/* Mode Switcher: E-Reader vs Facsimile PDF */}
          <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-xl p-0.5 border border-black/5 dark:border-white/10">
            <button
              onClick={() => displayMode !== 'ebook' && onToggleDisplayMode()}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-sans-ui font-medium transition-all cursor-pointer ${
                displayMode === 'ebook'
                  ? 'bg-[#8c6b2d] text-white shadow-xs'
                  : 'text-neutral-500 hover:text-current'
              }`}
              title="Modo Libro Digital"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Libro</span>
            </button>
            <button
              onClick={() => displayMode !== 'facsimile' && onToggleDisplayMode()}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-sans-ui font-medium transition-all cursor-pointer ${
                displayMode === 'facsimile'
                  ? 'bg-[#8c6b2d] text-white shadow-xs'
                  : 'text-neutral-500 hover:text-current'
              }`}
              title="Modo Facsímil PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* Center: Current Chapter & Page Progress */}
        <div className="flex-1 min-w-0 px-1 sm:px-2 text-center flex flex-col items-center justify-center overflow-hidden">
          <div className="w-full flex items-center justify-center gap-1 text-xs sm:text-sm font-sans-ui truncate">
            {chapterNumber > 0 ? (
              <div className="truncate flex items-center justify-center gap-1 max-w-full">
                <span className="font-bold text-[#8c6b2d] dark:text-[#d4af37] whitespace-nowrap">
                  Cap. {chapterNumber}
                </span>
                <span className="hidden md:inline text-neutral-400">·</span>
                <span className="hidden md:inline text-neutral-600 dark:text-neutral-300 truncate font-serif-book font-medium">
                  {chapterTitle}
                </span>
              </div>
            ) : (
              <span className="font-serif-book font-medium text-xs sm:text-sm truncate">
                {chapterTitle || "Un Curso de Milagros"}
              </span>
            )}
          </div>
          <div className="text-[10px] sm:text-[11px] font-sans-ui text-neutral-500 dark:text-neutral-400 whitespace-nowrap tabular-nums">
            Pág. <span className="font-semibold text-current">{currentPage}</span> / {TOTAL_PAGES}
            <span className="hidden xs:inline text-neutral-400 dark:text-neutral-500 ml-1">({progressPercent.toFixed(0)}%)</span>
          </div>
        </div>

        {/* Right: Typography (Aa), Audio, Bookmark, Search */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {/* Typography Settings (Aa) */}
          <button
            id="btn-header-typography"
            onClick={onOpenTypography}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Ajustes de texto y tema (Aa)"
          >
            <Type className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#8c6b2d] dark:text-[#d4af37]" />
          </button>

          {/* Audio Reading Toggle */}
          <button
            id="btn-header-audio"
            onClick={onToggleAudio}
            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
              isAudioActive
                ? 'bg-[#8c6b2d]/15 text-[#8c6b2d] ring-1 ring-[#8c6b2d]'
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300'
            }`}
            title="Escuchar con voz (Audio Lectura)"
          >
            <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Bookmark Button */}
          <button
            id="btn-header-bookmark"
            onClick={onToggleBookmark}
            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
              isBookmarked
                ? 'text-[#8c6b2d] dark:text-[#d4af37] bg-[#8c6b2d]/15'
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300'
            }`}
            title={isBookmarked ? "Marcador guardado en esta página" : "Añadir marcador a esta página"}
          >
            <BookmarkIcon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          {/* Oraciones del Perdón Button */}
          <button
            id="btn-header-oraciones"
            onClick={onOpenOraciones}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer text-amber-700 dark:text-amber-300 shadow-xs"
            title="Oraciones del Perdón (UCDM)"
          >
            <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Search Button (Desktop) */}
          <button
            id="btn-header-search"
            onClick={onOpenSearch}
            className="w-8 h-8 sm:w-10 sm:h-10 hidden sm:flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-neutral-600 dark:text-neutral-300"
            title="Buscar en el texto (Ctrl + F)"
          >
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>

      {/* Thin Interactive Progress Bar */}
      <div
        id="reader-progress-bar-container"
        onClick={handleProgressBarClick}
        className="w-full h-1 bg-black/10 dark:bg-white/10 cursor-pointer group relative overflow-hidden"
        title={`Progreso: ${progressPercent.toFixed(1)}% — Clic para saltar`}
      >
        <div
          id="reader-progress-bar-fill"
          className="h-full bg-[#8c6b2d] dark:bg-[#d4af37] transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/20 pointer-events-none" />
      </div>
    </header>
  );
};
