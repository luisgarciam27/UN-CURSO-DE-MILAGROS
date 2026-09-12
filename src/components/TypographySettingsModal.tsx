import React from 'react';
import { X, Type, Check, Sparkles, BookOpen } from 'lucide-react';
import { BookTheme, BookFontFamily, BookLineHeight, BookReadingWidth } from '../types';
import { THEME_CONFIG } from '../constants';

interface TypographySettingsModalProps {
  isOpen: boolean;
  theme: BookTheme;
  fontFamily: BookFontFamily;
  fontSize: number;
  lineHeight: BookLineHeight;
  readingWidth: BookReadingWidth;
  displayMode?: 'ebook' | 'facsimile';
  onSwitchToEbook?: () => void;
  onClose: () => void;
  onChangeTheme: (theme: BookTheme) => void;
  onChangeFontFamily: (font: BookFontFamily) => void;
  onChangeFontSize: (size: number) => void;
  onChangeLineHeight: (height: BookLineHeight) => void;
  onChangeReadingWidth: (width: BookReadingWidth) => void;
}

export const TypographySettingsModal: React.FC<TypographySettingsModalProps> = ({
  isOpen,
  theme,
  fontFamily,
  fontSize,
  lineHeight,
  readingWidth,
  displayMode = 'ebook',
  onSwitchToEbook,
  onClose,
  onChangeTheme,
  onChangeFontFamily,
  onChangeFontSize,
  onChangeLineHeight,
  onChangeReadingWidth,
}) => {
  if (!isOpen) return null;

  const currentTheme = THEME_CONFIG[theme];

  const themes: { id: BookTheme; label: string; previewBg: string; previewText: string }[] = [
    { id: 'sepia', label: 'Sepia', previewBg: 'bg-[#f5ede0]', previewText: 'text-[#3d2f20]' },
    { id: 'cream', label: 'Crema', previewBg: 'bg-[#faf8f4]', previewText: 'text-[#282520]' },
    { id: 'dark', label: 'Carbón', previewBg: 'bg-[#181b22]', previewText: 'text-[#e4e0d6]' },
    { id: 'midnight', label: 'OLED', previewBg: 'bg-[#000000]', previewText: 'text-[#ddd8ce]' },
  ];

  const fonts: { id: BookFontFamily; label: string; sublabel: string; className: string }[] = [
    { id: 'literata', label: 'Literata', sublabel: 'Edición Literaria', className: 'font-literata' },
    { id: 'newsreader', label: 'Newsreader', sublabel: 'Lectura Profunda y Calma', className: 'font-newsreader' },
    { id: 'atkinson', label: 'Atkinson', sublabel: 'Máxima Atención y Claridad', className: 'font-atkinson' },
    { id: 'merriweather', label: 'Merriweather', sublabel: 'Prensa y Estudio', className: 'font-merriweather' },
    { id: 'lora', label: 'Lora', sublabel: 'Clásica Elegante', className: 'font-lora' },
    { id: 'sans', label: 'Moderna', sublabel: 'Sin Serifa Limpia', className: 'font-sans-ui' },
  ];

  const fontPresets = [14, 16, 18, 20, 24, 28, 32];

  const activeFontClass = fonts.find((f) => f.id === fontFamily)?.className || 'font-literata';

  const previewLineHeight =
    lineHeight === 'compact' ? 1.5 : lineHeight === 'normal' ? 1.75 : 2.05;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border ${currentTheme.border} ${currentTheme.card} ${currentTheme.text} transition-colors duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-[#8c6b2d] dark:text-[#d4af37]" />
            <h3 className="text-base font-semibold font-sans-ui">Tipografía y Lectura</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar opciones"
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Facsimile Mode Alert Banner */}
        {displayMode === 'facsimile' && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-sans-ui flex items-center justify-between gap-2.5">
            <div className="text-amber-900 dark:text-amber-200 leading-snug">
              Estás en <strong>Modo PDF original</strong>. Para que el tamaño y estilo de letra apliquen al texto, pasa al <strong>Modo Libro</strong>.
            </div>
            {onSwitchToEbook && (
              <button
                type="button"
                onClick={onSwitchToEbook}
                className="px-2.5 py-1.5 rounded-lg bg-[#8c6b2d] text-white font-semibold text-xs whitespace-nowrap cursor-pointer hover:bg-[#775a24] active:scale-95 transition-all flex items-center gap-1 shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Modo Libro</span>
              </button>
            )}
          </div>
        )}

        {/* Theme Picker */}
        <div className="mb-5">
          <label className="text-xs font-medium font-sans-ui uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5 block">
            Color de Fondo
          </label>
          <div className="grid grid-cols-4 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeTheme(t.id)}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  t.previewBg
                } ${t.previewText} ${
                  theme === t.id
                    ? 'ring-2 ring-[#8c6b2d] border-[#8c6b2d] shadow-md scale-102'
                    : 'border-black/15 dark:border-white/15 opacity-85 hover:opacity-100'
                }`}
              >
                <span className="text-sm font-serif-book font-semibold">Aa</span>
                <span className="text-[11px] font-sans-ui font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Adjuster with live slider + preset buttons */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs font-medium font-sans-ui uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Tamaño de Letra</span>
            <span className="tabular-nums font-bold normal-case text-base text-[#8c6b2d] dark:text-[#d4af37]">
              {fontSize}px
            </span>
          </div>

          <div className="flex items-center gap-2.5 mb-2.5">
            <button
              type="button"
              onClick={() => onChangeFontSize(Math.max(13, fontSize - 1))}
              disabled={fontSize <= 13}
              aria-label="Reducir tamaño de letra"
              className={`w-11 h-10 rounded-xl border ${currentTheme.border} ${currentTheme.surface} flex items-center justify-center text-sm font-semibold font-serif-book disabled:opacity-30 cursor-pointer hover:bg-[#8c6b2d]/10 active:scale-95 transition-all`}
            >
              A-
            </button>
            <div className="flex-1 px-1">
              <input
                type="range"
                min="13"
                max="34"
                step="1"
                value={fontSize}
                onChange={(e) => onChangeFontSize(parseInt(e.target.value, 10))}
                onInput={(e) => onChangeFontSize(parseInt((e.target as HTMLInputElement).value, 10))}
                aria-label="Ajustar tamaño de letra"
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#8c6b2d] dark:accent-[#d4af37]"
              />
            </div>
            <button
              type="button"
              onClick={() => onChangeFontSize(Math.min(34, fontSize + 1))}
              disabled={fontSize >= 34}
              aria-label="Aumentar tamaño de letra"
              className={`w-11 h-10 rounded-xl border ${currentTheme.border} ${currentTheme.surface} flex items-center justify-center text-base font-bold font-serif-book disabled:opacity-30 cursor-pointer hover:bg-[#8c6b2d]/10 active:scale-95 transition-all`}
            >
              A+
            </button>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center justify-between gap-1">
            {fontPresets.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onChangeFontSize(size)}
                className={`flex-1 py-1 rounded-lg text-xs font-sans-ui font-medium tabular-nums transition-all cursor-pointer ${
                  fontSize === size
                    ? 'bg-[#8c6b2d] text-white shadow-xs font-bold'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Live Text Preview Box */}
          <div className={`mt-3 p-3.5 rounded-xl border ${currentTheme.border} ${currentTheme.surface} overflow-hidden transition-all duration-150`}>
            <p
              className={`${activeFontClass} transition-all duration-150 select-none`}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: previewLineHeight,
              }}
            >
              «Nada real puede ser amenazado. Nada irreal existe. En esto radica la paz de Dios.»
            </p>
            <div className="flex items-center justify-between text-[10px] font-sans-ui text-neutral-400 dark:text-neutral-500 mt-2 pt-2 border-t border-black/5 dark:border-white/5">
              <span>Vista previa en vivo</span>
              <span className="font-semibold text-[#8c6b2d] dark:text-[#d4af37]">
                {fontSize}px · {fonts.find((f) => f.id === fontFamily)?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Font Family Selection */}
        <div className="mb-5">
          <label className="text-xs font-medium font-sans-ui uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5 block">
            Tipografía
          </label>
          <div className="grid grid-cols-2 gap-2">
            {fonts.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onChangeFontFamily(f.id)}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  currentTheme.surface
                } ${
                  fontFamily === f.id
                    ? 'border-[#8c6b2d] ring-1 ring-[#8c6b2d] font-semibold text-[#8c6b2d] dark:text-[#d4af37]'
                    : `${currentTheme.border} opacity-85 hover:opacity-100`
                }`}
              >
                <div>
                  <span className={`block text-sm leading-tight ${f.className}`}>{f.label}</span>
                  <span className="block text-[10px] font-sans-ui text-neutral-500 mt-0.5">{f.sublabel}</span>
                </div>
                {fontFamily === f.id && <Check className="w-4 h-4 text-[#8c6b2d] dark:text-[#d4af37] flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Line Height & Width Controls */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/10 dark:border-white/10">
          <div>
            <label className="text-[11px] font-medium font-sans-ui uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5 block">
              Interlineado
            </label>
            <div className="flex rounded-lg border border-black/10 dark:border-white/10 p-0.5">
              {(['compact', 'normal', 'relaxed'] as BookLineHeight[]).map((lh) => (
                <button
                  key={lh}
                  type="button"
                  onClick={() => onChangeLineHeight(lh)}
                  className={`flex-1 py-1 text-[11px] font-sans-ui rounded capitalize cursor-pointer transition-colors ${
                    lineHeight === lh
                      ? 'bg-[#8c6b2d] text-white font-medium shadow-xs'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {lh === 'compact' ? 'Ajustado' : lh === 'normal' ? 'Medio' : 'Amplio'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium font-sans-ui uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5 block">
              Márgenes
            </label>
            <div className="flex rounded-lg border border-black/10 dark:border-white/10 p-0.5">
              {(['narrow', 'normal', 'wide'] as BookReadingWidth[]).map((rw) => (
                <button
                  key={rw}
                  type="button"
                  onClick={() => onChangeReadingWidth(rw)}
                  className={`flex-1 py-1 text-[11px] font-sans-ui rounded capitalize cursor-pointer transition-colors ${
                    readingWidth === rw
                      ? 'bg-[#8c6b2d] text-white font-medium shadow-xs'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {rw === 'narrow' ? 'Estrecho' : rw === 'normal' ? 'Estándar' : 'Ancho'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

