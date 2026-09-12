import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Type,
  Bookmark as BookmarkIcon,
  Sliders,
  X,
  BookOpen,
  Sparkles,
  Home
} from 'lucide-react';
import { BookTheme } from '../types';
import { THEME_CONFIG, TOTAL_PAGES, getChapterForPage, getChapterPageSpan } from '../constants';

interface ReaderFooterProps {
  visible: boolean;
  currentPage: number;
  theme: BookTheme;
  isFullscreen: boolean;
  isBookmarked: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSeekPage: (page: number) => void;
  onOpenTypography: () => void;
  onToggleBookmark: () => void;
  onToggleFullscreen: () => void;
  onGoHome?: () => void;
}

export const ReaderFooter: React.FC<ReaderFooterProps> = ({
  visible,
  currentPage,
  theme,
  isFullscreen,
  isBookmarked,
  onPrevPage,
  onNextPage,
  onSeekPage,
  onOpenTypography,
  onToggleBookmark,
  onToggleFullscreen,
  onGoHome,
}) => {
  const [isScrubberOpen, setIsScrubberOpen] = useState(false);
  const [inputPage, setInputPage] = useState(String(currentPage));
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const currentTheme = THEME_CONFIG[theme];
  const chapterInfo = getChapterForPage(currentPage);
  const chapterSpan = getChapterPageSpan(chapterInfo.number);
  const pagesRemainingInChapter = Math.max(0, chapterSpan.endPage - currentPage);
  const progressPercent = Math.round((currentPage / TOTAL_PAGES) * 100);

  // Sync input page
  useEffect(() => {
    setInputPage(String(currentPage));
  }, [currentPage]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!isScrubberOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsScrubberOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isScrubberOpen]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseInt(e.target.value, 10);
    if (!isNaN(target)) {
      onSeekPage(target);
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(inputPage, 10);
    if (!isNaN(p) && p >= 1 && p <= TOTAL_PAGES) {
      onSeekPage(p);
      setIsScrubberOpen(false);
    }
  };

  return (
    <footer
      id="reader-floating-dock"
      className={`fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ease-out pointer-events-none ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-8 opacity-0 pointer-events-none'
      }`}
    >
      {/* Floating Micro-Scrubber Popover Card (Expands on Demand) */}
      {isScrubberOpen && (
        <div
          ref={popoverRef}
          className={`pointer-events-auto absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-[92vw] max-w-sm p-4 rounded-2xl ${currentTheme.card} border ${currentTheme.border} ${currentTheme.text} shadow-2xl backdrop-blur-xl animate-fade-in flex flex-col gap-3`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
            <div>
              <span className="text-[10px] font-sans-ui uppercase tracking-wider text-[#8c6b2d] dark:text-[#d4af37] font-bold">
                Capítulo {chapterInfo.number}
              </span>
              <h4 className="text-xs sm:text-sm font-serif-book font-semibold truncate max-w-[220px]">
                {chapterInfo.title}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsScrubberOpen(false)}
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-current cursor-pointer transition-colors"
              title="Cerrar barra de progreso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrubber slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-sans-ui">
              <span className="text-neutral-400">Página {currentPage} de {TOTAL_PAGES}</span>
              <span className="font-semibold text-[#8c6b2d] dark:text-[#d4af37]">{progressPercent}%</span>
            </div>
            <input
              id="slider-floating-scrubber"
              type="range"
              min="1"
              max={TOTAL_PAGES}
              value={currentPage}
              onChange={handleSliderChange}
              className="w-full accent-[#8c6b2d] h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-sans-ui text-neutral-400">
              <span>Pág. 1 (Inicio)</span>
              <span>
                {pagesRemainingInChapter > 0
                  ? `${pagesRemainingInChapter} págs. para fin de cap.`
                  : 'Fin de capítulo'}
              </span>
              <span>Pág. {TOTAL_PAGES}</span>
            </div>
          </div>

          {/* Quick jump input form */}
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-2 pt-1">
            <span className="text-xs font-sans-ui text-neutral-500 whitespace-nowrap">Ir a pág:</span>
            <input
              type="number"
              min="1"
              max={TOTAL_PAGES}
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              className="w-16 px-2 py-1 text-center text-xs font-semibold rounded-lg border border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/10 text-current focus:outline-hidden focus:ring-1 focus:ring-[#8c6b2d]"
            />
            <button
              type="submit"
              className="flex-1 py-1 px-2.5 rounded-lg bg-[#8c6b2d] hover:bg-[#785922] text-white text-xs font-sans-ui font-semibold cursor-pointer transition-colors"
            >
              Saltar
            </button>
          </form>

          {/* Quick shortcuts to Home and Cover */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/10 dark:border-white/10">
            {onGoHome && (
              <button
                type="button"
                onClick={() => {
                  setIsScrubberOpen(false);
                  onGoHome();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-sans-ui hover:bg-[#8c6b2d]/15 text-[#8c6b2d] dark:text-[#d4af37] font-semibold cursor-pointer transition-colors"
                title="Volver a la pantalla de bienvenida / inicio"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Inicio</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsScrubberOpen(false);
                onSeekPage(1);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-sans-ui hover:bg-[#8c6b2d]/15 font-medium cursor-pointer transition-colors"
              title="Ir a la portada del libro (Página 1)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Portada (Pág. 1)</span>
            </button>
          </div>
        </div>
      )}

      {/* The Sleek Ultra-Compact Floating Capsule (Takes minimal reading space) */}
      <div
        className={`pointer-events-auto flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:py-1.5 rounded-full ${currentTheme.card} border ${currentTheme.border} ${currentTheme.text} shadow-xl backdrop-blur-xl transition-all duration-200`}
      >
        {/* Ir a Inicio */}
        {onGoHome && (
          <button
            id="btn-footer-home"
            onClick={onGoHome}
            aria-label="Ir a la pantalla de Inicio"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-[#8c6b2d] dark:text-[#d4af37] transition-all cursor-pointer active:scale-95"
            title="Ir a Inicio"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Previous Page Arrow */}
        <button
          id="btn-footer-prev-page"
          onClick={onPrevPage}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer group active:scale-95"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* Center Page Pill: Tap to open scrubber */}
        <button
          type="button"
          onClick={() => setIsScrubberOpen((v) => !v)}
          className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-sans-ui whitespace-nowrap transition-all cursor-pointer ${
            isScrubberOpen
              ? 'bg-[#8c6b2d] text-white font-semibold shadow-xs'
              : 'hover:bg-black/5 dark:hover:bg-white/10'
          }`}
          title="Tocar para ajustar página o ver progreso"
        >
          <span className="tabular-nums font-semibold whitespace-nowrap">
            {currentPage}
            <span className="opacity-50 font-normal"> / {TOTAL_PAGES}</span>
          </span>

          <Sliders className="w-3 h-3 opacity-50 ml-0.5" />
        </button>

        {/* Next Page Arrow */}
        <button
          id="btn-footer-next-page"
          onClick={onNextPage}
          disabled={currentPage >= TOTAL_PAGES}
          aria-label="Página siguiente"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer group active:scale-95"
          title="Página siguiente"
        >
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-[#8c6b2d] dark:text-[#d4af37]" />
        </button>

        {/* Subtle divider */}
        <div className="w-px h-4 bg-black/10 dark:bg-white/10 my-auto mx-0.5" />

        {/* Aa Typography Settings */}
        <button
          id="btn-footer-typography"
          onClick={onOpenTypography}
          aria-label="Ajustes de texto y tipografía"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
          title="Tipografía y modo lectura (Aa)"
        >
          <Type className="w-3.5 h-3.5" />
        </button>

        {/* Bookmark BookmarkIcon */}
        <button
          id="btn-footer-bookmark"
          onClick={onToggleBookmark}
          aria-label={isBookmarked ? "Quitar marcador" : "Marcar página"}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isBookmarked
              ? 'text-[#8c6b2d] dark:text-[#d4af37] bg-[#8c6b2d]/10'
              : 'hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500'
          }`}
          title={isBookmarked ? "Página marcada" : "Marcar página"}
        >
          <BookmarkIcon className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>

        {/* Fullscreen toggle */}
        <button
          id="btn-footer-fullscreen"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 transition-colors cursor-pointer"
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </button>
      </div>
    </footer>
  );
};
