import React from 'react';
import { BookOpen, Compass, RotateCcw, ArrowRight, Sun, Moon, Sparkles } from 'lucide-react';
import { BOOK_TITLE, BOOK_SUBTITLE, BOOK_FOUNDATION, BOOK_TRANSLATION, getChapterForPage, TOTAL_PAGES } from '../constants';
import { BookTheme } from '../types';

interface WelcomeScreenProps {
  lastPage: number;
  theme: BookTheme;
  onToggleTheme: () => void;
  onContinue: () => void;
  onStartBeginning: () => void;
  onOpenIndex: () => void;
  onCustomFileLoaded?: (file: File) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  lastPage,
  theme,
  onToggleTheme,
  onContinue,
  onStartBeginning,
  onOpenIndex,
  onCustomFileLoaded,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const isDark = theme === 'dark' || theme === 'midnight';
  const hasProgress = lastPage > 1;
  const lastChapter = hasProgress ? getChapterForPage(lastPage) : null;
  const progressPercent = Math.round((lastPage / TOTAL_PAGES) * 100);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onCustomFileLoaded) {
      onCustomFileLoaded(file);
    }
  };

  return (
    <div
      id="welcome-screen"
      className="min-h-screen w-full flex flex-col justify-between items-center px-4 py-6 md:py-10 bg-[#f7f5f0] dark:bg-[#121417] text-[#2c2925] dark:text-[#e4e1d9] transition-colors duration-300 relative overflow-y-auto"
    >
      {/* Top Bar on Welcome Screen */}
      <header className="w-full max-w-4xl flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-xs md:text-sm tracking-widest text-[#726d63] dark:text-[#9d978a] font-sans-ui uppercase">
          <Sparkles className="w-4 h-4 text-[#99793d] dark:text-[#d4af37]" />
          <span>Lector Digital Interactivo</span>
        </div>
        <button
          id="btn-welcome-theme-toggle"
          onClick={onToggleTheme}
          aria-label="Cambiar tema de color"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#ded8cb] dark:border-[#2f353d] bg-[#f0ecdf] dark:bg-[#1a1e24] text-xs font-sans-ui text-[#524e46] dark:text-[#c4bfb3] hover:bg-[#e6e1d3] dark:hover:bg-[#252b33] transition-all cursor-pointer shadow-xs"
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
      </header>

      {/* Main Cover Card */}
      <main className="my-auto w-full max-w-2xl text-center py-8 md:py-12 flex flex-col items-center">
        {/* Decorative spiritual frame */}
        <div className="w-full border border-[#ded8cb] dark:border-[#2d323b] p-6 sm:p-10 md:p-14 rounded-2xl bg-[#fbf9f4] dark:bg-[#16191f] shadow-sm relative">
          <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-[#99793d] dark:border-[#d4af37]" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-[#99793d] dark:border-[#d4af37]" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-[#99793d] dark:border-[#d4af37]" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-[#99793d] dark:border-[#d4af37]" />

          {/* Book Header */}
          <p className="text-xs md:text-sm tracking-[0.25em] font-sans-ui uppercase text-[#888173] dark:text-[#999285] mb-3">
            {BOOK_FOUNDATION}
          </p>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-semibold tracking-wide text-[#1c1a17] dark:text-[#f3f0e8] leading-tight my-4">
            {BOOK_TITLE}
          </h1>

          <div className="w-16 h-px bg-[#c9b58e] dark:bg-[#726442] mx-auto my-4" />

          <p className="text-base sm:text-lg font-serif-book italic text-[#5a5449] dark:text-[#b8b3a7] mb-6">
            {BOOK_SUBTITLE}
          </p>

          <p className="text-xs sm:text-sm font-sans-ui text-[#777063] dark:text-[#8e887b] max-w-md mx-auto mb-8 leading-relaxed">
            {BOOK_TRANSLATION}
          </p>

          {/* Spiritual Axiom Quote */}
          <div className="border-t border-b border-[#eae4d5] dark:border-[#282d36] py-4 px-3 mb-8 bg-[#f5f1e7]/60 dark:bg-[#1a1e26]/60 rounded-lg">
            <p className="font-serif-book italic text-sm sm:text-base text-[#3d3830] dark:text-[#ddd8cb] leading-relaxed">
              «Nada real puede ser amenazado. Nada irreal existe. En esto radica la paz de Dios.»
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col gap-3.5 w-full max-w-md mx-auto">
            {hasProgress && (
              <button
                id="btn-welcome-continue"
                onClick={onContinue}
                className="group w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-[#2e3e4e] hover:bg-[#253240] dark:bg-[#d4af37] dark:hover:bg-[#c29e2f] text-white dark:text-[#14171c] font-sans-ui font-medium text-sm sm:text-base shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 text-left">
                  <BookOpen className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Continuar leyendo</div>
                    <div className="text-xs opacity-85">
                      Pág. {lastPage} de {TOTAL_PAGES} ({progressPercent}%) • Cap. {lastChapter?.number}: {lastChapter?.title}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            )}

            <button
              id="btn-welcome-start"
              onClick={onStartBeginning}
              className={`w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl border font-sans-ui font-medium text-sm sm:text-base transition-all cursor-pointer ${
                hasProgress
                  ? 'border-[#ded8cb] dark:border-[#2f353d] bg-white dark:bg-[#1a1e24] text-[#3c372f] dark:text-[#dfdbd1] hover:bg-[#f2eee5] dark:hover:bg-[#242a33]'
                  : 'bg-[#2e3e4e] hover:bg-[#253240] dark:bg-[#d4af37] dark:hover:bg-[#c29e2f] text-white dark:text-[#14171c] shadow-sm'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{hasProgress ? "Empezar desde el principio (Página 1)" : "Empezar lectura"}</span>
            </button>

            <button
              id="btn-welcome-index"
              onClick={onOpenIndex}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-transparent text-[#615a4e] dark:text-[#aba495] hover:text-[#2c2925] dark:hover:text-white hover:bg-[#ede7d9]/60 dark:hover:bg-[#20252e] font-sans-ui text-sm transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Ver índice de los 31 capítulos</span>
            </button>
          </div>
        </div>

        {/* Custom PDF Upload / Replacement option */}
        <div className="mt-5 text-xs text-[#80796c] dark:text-[#888174] flex items-center justify-center gap-2 font-sans-ui">
          <span>Archivo cargado: <strong className="font-semibold">UCDM_Texto.pdf</strong></span>
          <span>•</span>
          <button
            id="btn-welcome-load-custom"
            onClick={() => fileInputRef.current?.click()}
            className="underline hover:text-[#2c2925] dark:hover:text-white transition-colors cursor-pointer"
            title="Seleccionar otro archivo PDF de tu equipo"
          >
            Cargar otro PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-4xl text-center text-xs text-[#8a8375] dark:text-[#7f786c] font-sans-ui z-10 pt-4 border-t border-[#ded8cb]/60 dark:border-[#252a33]">
        <p>Lector sin distracciones • Guardado automático en tu navegador • 31 Capítulos • 297 Páginas</p>
      </footer>
    </div>
  );
};
