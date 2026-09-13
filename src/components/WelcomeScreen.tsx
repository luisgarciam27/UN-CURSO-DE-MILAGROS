import React from 'react';
import { BookOpen, Compass, RotateCcw, ArrowRight, Sun, Moon, Sparkles, Search, Bookmark as BookmarkIcon, FileUp } from 'lucide-react';
import { BOOK_TITLE, BOOK_SUBTITLE, BOOK_FOUNDATION, BOOK_TRANSLATION, getChapterForPage, TOTAL_PAGES } from '../constants';
import { BookTheme } from '../types';

interface WelcomeScreenProps {
  lastPage: number;
  theme: BookTheme;
  onToggleTheme: () => void;
  onContinue: () => void;
  onStartBeginning: () => void;
  onOpenIndex: () => void;
  onOpenSearch?: () => void;
  onOpenBookmarks?: () => void;
  onCustomFileLoaded?: (file: File) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  lastPage,
  theme,
  onToggleTheme,
  onContinue,
  onStartBeginning,
  onOpenIndex,
  onOpenSearch,
  onOpenBookmarks,
  onCustomFileLoaded,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const isDark = theme === 'dark' || theme === 'midnight';
  const hasProgress = lastPage > 1;
  const lastChapter = hasProgress ? getChapterForPage(lastPage) : null;
  const progressPercent = Math.min(100, Math.max(1, Math.round((lastPage / TOTAL_PAGES) * 100)));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onCustomFileLoaded) {
      onCustomFileLoaded(file);
    }
  };

  return (
    <div
      id="welcome-screen"
      className="min-h-[100dvh] w-full flex flex-col justify-between items-center px-3 sm:px-6 py-2.5 sm:py-5 bg-[#f7f5f0] dark:bg-[#121417] text-[#2c2925] dark:text-[#e4e1d9] transition-colors duration-300 relative overflow-y-auto overscroll-y-contain pb-24 sm:pb-8"
    >
      {/* Top Navigation Bar on Welcome Screen */}
      <header className="w-full max-w-2xl flex justify-between items-center z-10 py-1 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs tracking-wider sm:tracking-widest text-[#726d63] dark:text-[#9d978a] font-sans-ui uppercase font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#99793d] dark:text-[#d4af37]" />
          <span>Lector Digital Interactivo</span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenSearch && (
            <button
              id="btn-welcome-search-quick"
              onClick={onOpenSearch}
              aria-label="Buscar en el texto"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#ded8cb] dark:border-[#2f353d] bg-[#f0ecdf] dark:bg-[#1a1e24] text-xs font-sans-ui text-[#524e46] dark:text-[#c4bfb3] hover:bg-[#e6e1d3] dark:hover:bg-[#252b33] transition-all cursor-pointer shadow-xs active:scale-95"
              title="Buscar en todo el libro"
            >
              <Search className="w-3.5 h-3.5 text-[#8c6b2d] dark:text-[#d4af37]" />
              <span className="hidden xs:inline">Buscar</span>
            </button>
          )}

          <button
            id="btn-welcome-theme-toggle"
            onClick={onToggleTheme}
            aria-label="Cambiar tema de color"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-[#ded8cb] dark:border-[#2f353d] bg-[#f0ecdf] dark:bg-[#1a1e24] text-xs font-sans-ui text-[#524e46] dark:text-[#c4bfb3] hover:bg-[#e6e1d3] dark:hover:bg-[#252b33] transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="hidden sm:inline">Modo Día</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#4a6b82]" />
                <span className="hidden sm:inline">Modo Noche</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Cover Card - Optimized for mobile viewport & touch ergonomics */}
      <main className="w-full max-w-xl text-center py-2 sm:py-6 flex flex-col items-center my-auto">
        {/* Decorative spiritual frame with balanced padding on mobile */}
        <div className="w-full border border-[#ded8cb] dark:border-[#2d323b] p-3.5 sm:p-7 md:p-9 rounded-2xl bg-[#fbf9f4]/95 dark:bg-[#16191f]/95 shadow-sm relative backdrop-blur-xs">
          {/* Subtle spiritual corner markers */}
          <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-[#99793d] dark:border-[#d4af37]" />
          <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-[#99793d] dark:border-[#d4af37]" />
          <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-[#99793d] dark:border-[#d4af37]" />
          <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-[#99793d] dark:border-[#d4af37]" />

          {/* Book Header */}
          <p className="text-[10px] sm:text-xs tracking-[0.2em] font-sans-ui uppercase text-[#888173] dark:text-[#999285] mb-1">
            {BOOK_FOUNDATION}
          </p>

          <h1 className="text-xl sm:text-3xl md:text-4xl font-display font-semibold tracking-wide text-[#1c1a17] dark:text-[#f3f0e8] leading-tight my-1 sm:my-2.5">
            {BOOK_TITLE}
          </h1>

          <div className="w-12 sm:w-16 h-px bg-[#c9b58e] dark:bg-[#726442] mx-auto my-1.5 sm:my-3" />

          <p className="text-xs sm:text-base font-serif-book italic font-semibold text-[#5a5449] dark:text-[#b8b3a7] mb-1">
            {BOOK_SUBTITLE}
          </p>

          <p className="text-[10px] sm:text-xs font-sans-ui text-[#777063] dark:text-[#8e887b] max-w-sm mx-auto mb-2.5 sm:mb-4 leading-normal">
            {BOOK_TRANSLATION}
          </p>

          {/* Spiritual Axiom Quote - Compact and comfortable */}
          <div className="border border-[#eae4d5] dark:border-[#282d36] py-2 px-3 mb-3.5 sm:mb-5 bg-[#f5f1e7]/80 dark:bg-[#1a1e26]/80 rounded-xl">
            <p className="font-serif-book italic text-xs sm:text-sm text-[#3d3830] dark:text-[#ddd8cb] leading-snug">
              «Nada real puede ser amenazado. Nada irreal existe. En esto radica la paz de Dios.»
            </p>
          </div>

          {/* Primary Action Stack & Touch-friendly Grid on Mobile */}
          <div className="flex flex-col gap-2 sm:gap-2.5 w-full mx-auto">
            {/* Primary Action: Continuar lectura (Hero CTA) */}
            {hasProgress && (
              <button
                id="btn-welcome-continue"
                onClick={onContinue}
                className="group w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-[#243342] to-[#2e3e4e] hover:from-[#1d2935] hover:to-[#253240] dark:from-[#d4af37] dark:to-[#b89528] text-white dark:text-[#14171c] font-sans-ui shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99] text-left"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-white/15 dark:bg-black/15 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-amber-300 dark:text-[#14171c]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs sm:text-sm leading-tight flex items-center justify-between gap-1">
                      <span>Continuar lectura</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/20 text-white dark:text-[#14171c] tabular-nums">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs opacity-85 truncate mt-0.5">
                      Pág. {lastPage} de {TOTAL_PAGES} • Cap. {lastChapter?.number}: {lastChapter?.title}
                    </div>
                    {/* Mini progress bar */}
                    <div className="w-full h-1 bg-white/20 dark:bg-black/20 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 dark:bg-[#14171c] rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0 transition-transform group-hover:translate-x-1" />
              </button>
            )}

            {/* Quick 2-Column Action Grid for Mobile & Desktop */}
            <div className="grid grid-cols-2 gap-2 w-full">
              {/* Empezar desde la página 1 */}
              <button
                id="btn-welcome-start"
                onClick={onStartBeginning}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-3 rounded-xl border border-[#ded8cb] dark:border-[#2f353d] bg-white dark:bg-[#1a1e24] text-[#3c372f] dark:text-[#dfdbd1] hover:bg-[#f2eee5] dark:hover:bg-[#242a33] font-sans-ui text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#8c6b2d] dark:text-[#d4af37] flex-shrink-0" />
                <span className="truncate">{hasProgress ? "Pág. 1 (Inicio)" : "Empezar Texto"}</span>
              </button>

              {/* Ver índice de capítulos */}
              <button
                id="btn-welcome-index"
                onClick={onOpenIndex}
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-3 rounded-xl border border-[#ded8cb] dark:border-[#2f353d] bg-white dark:bg-[#1a1e24] text-[#3c372f] dark:text-[#dfdbd1] hover:bg-[#f2eee5] dark:hover:bg-[#242a33] font-sans-ui text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] shadow-2xs"
              >
                <Compass className="w-3.5 h-3.5 text-[#8c6b2d] dark:text-[#d4af37] flex-shrink-0" />
                <span className="truncate">31 Capítulos</span>
              </button>
            </div>

            {/* Quick Tools Row (Buscador, Guardados, PDF) */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 w-full text-[11px] font-sans-ui">
              {onOpenSearch ? (
                <button
                  onClick={onOpenSearch}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#5a5347] dark:text-[#c4bfb3] transition-colors cursor-pointer"
                >
                  <Search className="w-3 h-3 text-[#8c6b2d] dark:text-[#d4af37]" />
                  <span>Buscador</span>
                </button>
              ) : null}

              {onOpenBookmarks ? (
                <button
                  onClick={onOpenBookmarks}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#5a5347] dark:text-[#c4bfb3] transition-colors cursor-pointer"
                >
                  <BookmarkIcon className="w-3 h-3 text-[#8c6b2d] dark:text-[#d4af37]" />
                  <span>Guardados</span>
                </button>
              ) : null}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#5a5347] dark:text-[#c4bfb3] transition-colors cursor-pointer"
                title="Cargar otro PDF"
              >
                <FileUp className="w-3 h-3 text-[#8c6b2d] dark:text-[#d4af37]" />
                <span>Otro PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hidden PDF file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </main>

      {/* Footer info - Compact on mobile, generous spacing from edge */}
      <footer className="w-full max-w-xl text-center text-[10px] sm:text-xs text-[#8a8375] dark:text-[#7f786c] font-sans-ui z-10 pt-2 sm:pt-3 border-t border-[#ded8cb]/60 dark:border-[#252a33] flex-shrink-0">
        <p>Lectura sin distracciones • Guardado automático en tu dispositivo • 31 Capítulos • 297 Páginas</p>
      </footer>
    </div>
  );
};

