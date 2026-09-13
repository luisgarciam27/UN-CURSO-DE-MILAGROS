import React, { useState, useEffect } from 'react';
import { 
  X, Search, Sparkles, Copy, Check, BookmarkPlus, 
  Star, Volume2, Maximize2, Minimize2, ArrowRight, ArrowLeft,
  Heart, Shield, Sun, Users, Compass, BookOpen
} from 'lucide-react';
import { PrayerItem } from '../types';
import { PRAYERS_DATABASE, PRAYER_CATEGORIES } from '../data/prayersData';

interface OracionesPerdonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAsNote?: (title: string, prayerText: string) => void;
  onGoToReading?: () => void;
}

interface CategoryMeta {
  label: string;
  subtitle: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  all: {
    label: 'Todas las Oraciones',
    subtitle: 'El santuario completo',
    gradient: 'from-[#382813] via-[#241a0d] to-[#151008]',
    icon: BookOpen
  },
  sanacion: {
    label: 'Sanación y Paz',
    subtitle: 'Soltar culpa y dolor',
    gradient: 'from-[#422610] via-[#2a180b] to-[#150d06]',
    icon: Heart
  },
  conflictos: {
    label: 'Conflictos y Juicios',
    subtitle: 'Sanar la causa raíz',
    gradient: 'from-[#382216] via-[#24160e] to-[#140b07]',
    icon: Shield
  },
  rendicion: {
    label: 'Rendición y Entrega',
    subtitle: 'Descansar en Dios',
    gradient: 'from-[#3b2e10] via-[#251d0b] to-[#140f06]',
    icon: Sun
  },
  relaciones: {
    label: 'Relaciones Santas',
    subtitle: 'Ver la inocencia',
    gradient: 'from-[#3b1d28] via-[#26131a] to-[#140a0e]',
    icon: Users
  },
  familia: {
    label: 'Familia e Hijos',
    subtitle: 'Paz y reconciliación',
    gradient: 'from-[#192e24] via-[#101d17] to-[#080f0c]',
    icon: Compass
  },
  abundancia: {
    label: 'Abundancia del Ser',
    subtitle: 'Reconocer la plenitud',
    gradient: 'from-[#382d13] via-[#231c0c] to-[#130f07]',
    icon: Sparkles
  }
};

export const OracionesPerdonModal: React.FC<OracionesPerdonModalProps> = ({
  isOpen,
  onClose,
  onSaveAsNote,
  onGoToReading,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePrayer, setActivePrayer] = useState<PrayerItem | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<boolean>(false);
  const [savedToast, setSavedToast] = useState<boolean>(false);
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ucdm_prayer_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');

  useEffect(() => {
    localStorage.setItem('ucdm_prayer_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // When modal opens, on desktop ensure there is a prayer selected, but on mobile allow viewing categories
  useEffect(() => {
    if (isOpen && !activePrayer && PRAYERS_DATABASE.length > 0) {
      const isDesktop = window.innerWidth >= 768;
      if (isDesktop) {
        const first = PRAYERS_DATABASE[0];
        setActivePrayer(first);
        const initialVals: Record<string, string> = {};
        if (first.fields) {
          first.fields.forEach((f) => {
            initialVals[f.key] = f.defaultValue || '';
          });
        }
        setFieldValues(initialVals);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const playSacredChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3.0);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 3.1);
    } catch {
      // AudioContext not supported
    }
  };

  const filteredPrayers = PRAYERS_DATABASE.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesFav = !showFavoritesOnly || favorites.includes(p.id);
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.textTemplate.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesFav && matchesSearch;
  });

  const handleSelectPrayer = (prayer: PrayerItem) => {
    setActivePrayer(prayer);
    const initialVals: Record<string, string> = {};
    if (prayer.fields) {
      prayer.fields.forEach((f) => {
        initialVals[f.key] = f.defaultValue || '';
      });
    }
    setFieldValues(initialVals);
    setCopied(false);
  };

  const handleFieldChange = (key: string, val: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: val }));
  };

  const getRenderedText = (prayer: PrayerItem) => {
    let text = prayer.textTemplate;
    if (prayer.fields) {
      prayer.fields.forEach((f) => {
        const val = fieldValues[f.key] || `[${f.label}]`;
        const regex = new RegExp(`\\{${f.key}\\}`, 'g');
        text = text.replace(regex, val);
      });
    }
    return text;
  };

  const handleCopy = () => {
    if (!activePrayer) return;
    const textToCopy = `${activePrayer.title}\n\n${getRenderedText(activePrayer)}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveNote = () => {
    if (!activePrayer || !onSaveAsNote) return;
    const rendered = getRenderedText(activePrayer);
    onSaveAsNote(activePrayer.title, rendered);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return PRAYERS_DATABASE.length;
    return PRAYERS_DATABASE.filter(p => p.category === catId).length;
  };

  // On desktop, fallback to first prayer in list so right side is never empty
  const currentPrayer = activePrayer || (filteredPrayers.length > 0 ? filteredPrayers[0] : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full ${isZenMode ? 'max-w-5xl h-[98dvh]' : 'max-w-5xl h-[96dvh] sm:h-[88vh] max-h-[780px]'} bg-[#fffefc] dark:bg-[#141311] text-[#242320] dark:text-[#f2efe9] rounded-2xl shadow-2xl border border-[#d4af37]/40 flex flex-col overflow-hidden`}>
        
        {/* Compact, Clean Header */}
        <div className="px-3.5 sm:px-5 py-2.5 border-b border-[#d4af37]/30 flex items-center justify-between bg-gradient-to-r from-[#8c6b2d]/15 via-transparent to-[#8c6b2d]/15 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8c6b2d] text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-serif font-bold tracking-wide text-[#8c6b2d] dark:text-[#d4af37]">
                Oraciones del Perdón
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onGoToReading && (
              <button
                onClick={onGoToReading}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#8c6b2d]/15 to-amber-500/20 hover:from-[#8c6b2d]/25 hover:to-amber-500/30 text-[#8c6b2d] dark:text-[#d4af37] text-xs font-semibold transition-all cursor-pointer border border-[#8c6b2d]/40 active:scale-95 shadow-xs"
                title="Ir al libro de texto para continuar leyendo"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ir al Libro</span>
              </button>
            )}

            {currentPrayer && (
              <button
                onClick={() => setIsZenMode(!isZenMode)}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8c6b2d]/10 hover:bg-[#8c6b2d]/20 text-[#8c6b2d] dark:text-[#d4af37] text-xs font-semibold transition-all cursor-pointer border border-[#8c6b2d]/30"
                title={isZenMode ? "Salir de pantalla completa" : "Modo Zen"}
              >
                {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isZenMode ? 'Normal' : 'Zen'}</span>
              </button>
            )}

            <button
              onClick={playSacredChime}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#8c6b2d]/10 hover:bg-[#8c6b2d]/20 text-[#8c6b2d] dark:text-[#d4af37] transition-all cursor-pointer border border-[#8c6b2d]/20"
              title="Campana de Paz (432Hz)"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Panel: Categories & Prayers List */}
          {/* On Mobile: Visible when NOT viewing active prayer. On Desktop: Always visible unless in Zen Mode */}
          <div className={`w-full md:w-5/12 border-r border-[#d4af37]/25 flex flex-col min-h-0 bg-[#faf7f0]/95 dark:bg-[#151412]/95 ${
            isZenMode && currentPrayer ? 'hidden' : activePrayer ? 'hidden md:flex' : 'flex'
          }`}>
            
            {/* Search and Top Controls */}
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 space-y-2 bg-white/90 dark:bg-black/40 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8c6b2d]" />
                <input
                  type="text"
                  placeholder="Buscar oración o tema..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-7 py-1.5 bg-white dark:bg-neutral-900 border border-[#d4af37]/30 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#8c6b2d] text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Horizontal Scrollable Category Chips for fast tapping on mobile */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {PRAYER_CATEGORIES.map((c) => {
                  const isSelected = selectedCategory === c.id;
                  const count = getCategoryCount(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`flex-shrink-0 px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#d4af37] to-[#8c6b2d] text-white border-[#8c6b2d] shadow-xs'
                          : 'bg-white/80 dark:bg-neutral-900/80 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-neutral-800 hover:border-[#8c6b2d]/50'
                      }`}
                    >
                      {c.id === 'all' ? 'Todas' : c.label.split(' ')[0]} ({count})
                    </button>
                  );
                })}

                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                    showFavoritesOnly
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white/80 dark:bg-neutral-900/80 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-neutral-800'
                  }`}
                  title="Mostrar favoritas"
                >
                  <Star className={`w-3 h-3 ${showFavoritesOnly ? 'fill-white' : 'text-amber-500'}`} />
                  <span>Favoritas ({favorites.length})</span>
                </button>
              </div>
            </div>

            {/* Scrollable List / Visual Categories */}
            <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2">
              
              {/* If "Todas" is selected and not searching, show the 2-column mobile-optimized cards */}
              {selectedCategory === 'all' && !searchQuery && !showFavoritesOnly ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1 pt-1">
                    <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#8c6b2d] dark:text-[#d4af37]">
                      Temas del Perdón
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {PRAYERS_DATABASE.length} oraciones
                    </span>
                  </div>

                  {/* 2-column touch-friendly grid on mobile & desktop */}
                  <div className="grid grid-cols-2 gap-2">
                    {PRAYER_CATEGORIES.filter(c => c.id !== 'all').map((cat) => {
                      const count = getCategoryCount(cat.id);
                      const meta = CATEGORY_META[cat.id] || CATEGORY_META.all;
                      const IconComponent = meta.icon;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className="group relative h-24 sm:h-28 rounded-xl overflow-hidden shadow-xs border border-[#d4af37]/30 hover:border-[#d4af37]/80 cursor-pointer transition-all duration-200 active:scale-95 flex flex-col justify-between p-2.5"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient}`}></div>
                          
                          {/* Top Row: Icon + Count */}
                          <div className="relative z-10 flex items-center justify-between">
                            <span className="w-6 h-6 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-200 shadow-xs">
                              <IconComponent className="w-3.5 h-3.5" />
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[9px] font-semibold text-amber-100/90">
                              {count} {count === 1 ? 'oración' : 'oraciones'}
                            </span>
                          </div>

                          {/* Bottom Row: Title + Subtitle */}
                          <div className="relative z-10">
                            <h4 className="font-serif font-bold text-white text-xs sm:text-sm leading-tight group-hover:text-amber-200 transition-colors">
                              {meta.label}
                            </h4>
                            <p className="text-[10px] text-amber-200/80 leading-tight mt-0.5 truncate">
                              {meta.subtitle}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Prayer List when filtered or searched */
                <div className="space-y-1.5">
                  {selectedCategory !== 'all' && (
                    <div className="flex items-center justify-between px-1 py-1 bg-amber-500/10 dark:bg-amber-500/5 rounded-lg border border-amber-500/20 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-serif font-bold text-[#8c6b2d] dark:text-[#d4af37]">
                          {CATEGORY_META[selectedCategory]?.label || selectedCategory}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          ({filteredPrayers.length})
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className="text-[11px] text-[#8c6b2d] dark:text-[#d4af37] underline font-semibold cursor-pointer"
                      >
                        Ver todas
                      </button>
                    </div>
                  )}

                  {filteredPrayers.length === 0 ? (
                    <div className="text-center py-12 px-4 text-neutral-400 text-xs">
                      No se encontraron oraciones para este criterio.
                    </div>
                  ) : (
                    filteredPrayers.map((prayer) => {
                      const isFav = favorites.includes(prayer.id);
                      const isSelected = currentPrayer?.id === prayer.id;
                      return (
                        <div
                          key={prayer.id}
                          onClick={() => handleSelectPrayer(prayer)}
                          className={`group relative p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer flex flex-col gap-1 border ${
                            isSelected
                              ? 'bg-[#8c6b2d]/15 dark:bg-[#8c6b2d]/25 border-[#8c6b2d] shadow-xs'
                              : 'bg-white/90 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 hover:border-[#8c6b2d]/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-serif font-bold text-xs sm:text-sm text-[#8c6b2d] dark:text-[#d4af37] line-clamp-1">
                              {prayer.title}
                            </span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => toggleFavorite(prayer.id, e)}
                                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                                title={isFav ? "Quitar de favoritas" : "Marcar como favorita"}
                              >
                                <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-500' : 'text-neutral-300 dark:text-neutral-600'}`} />
                              </button>
                              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#8c6b2d] group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2 font-sans">
                            {prayer.description}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Prayer Reader View */}
          {/* On Mobile: Visible when an activePrayer is selected. On Desktop: Always visible side-by-side */}
          <div className={`w-full ${isZenMode ? 'w-full' : 'md:w-7/12'} ${
            activePrayer ? 'flex' : 'hidden md:flex'
          } flex-col min-h-0 bg-gradient-to-br from-[#fffdfa] via-[#fcf9f2] to-[#faf4e6] dark:from-[#161412] dark:via-[#141210] dark:to-[#0f0e0c]`}>
            {currentPrayer ? (
              <div className="flex-1 min-h-0 flex flex-col">
                
                {/* Active Prayer Bar */}
                <div className="px-3.5 sm:px-4 py-2 border-b border-[#d4af37]/25 flex items-center justify-between bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Mobile Back Button: brings back the category/prayer list cleanly */}
                    <button
                      onClick={() => setActivePrayer(null)}
                      className="md:hidden text-xs text-[#8c6b2d] dark:text-[#d4af37] font-semibold flex items-center gap-1 cursor-pointer bg-[#8c6b2d]/15 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver</span>
                    </button>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-[#8c6b2d] dark:text-[#d4af37]">
                        {currentPrayer.categoryLabel}
                      </span>
                      <h3 className="font-serif font-bold text-xs sm:text-base text-neutral-900 dark:text-white line-clamp-1">
                        {currentPrayer.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-lg p-0.5 border border-[#d4af37]/25">
                      <button
                        onClick={() => setFontSize('normal')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${fontSize === 'normal' ? 'bg-[#8c6b2d] text-white' : 'text-neutral-600 dark:text-neutral-400'}`}
                        title="Texto regular"
                      >
                        A
                      </button>
                      <button
                        onClick={() => setFontSize('large')}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${fontSize === 'large' ? 'bg-[#8c6b2d] text-white' : 'text-neutral-600 dark:text-neutral-400'}`}
                        title="Texto grande"
                      >
                        A+
                      </button>
                      <button
                        onClick={() => setFontSize('xlarge')}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${fontSize === 'xlarge' ? 'bg-[#8c6b2d] text-white' : 'text-neutral-600 dark:text-neutral-400'}`}
                        title="Texto extra grande"
                      >
                        A++
                      </button>
                    </div>

                    <button
                      onClick={(e) => toggleFavorite(currentPrayer.id, e)}
                      className="p-1.5 rounded-lg bg-[#8c6b2d]/10 text-amber-500 border border-[#8c6b2d]/20"
                      title={favorites.includes(currentPrayer.id) ? "Quitar de favoritas" : "Guardar en favoritas"}
                    >
                      <Star className={`w-3.5 h-3.5 ${favorites.includes(currentPrayer.id) ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Scrollable Prayer Content */}
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5">
                  
                  {/* Fillable Fields (if any) */}
                  {currentPrayer.fields && currentPrayer.fields.length > 0 && (
                    <div className="p-3 bg-gradient-to-br from-[#8c6b2d]/10 to-amber-500/5 rounded-xl border border-[#8c6b2d]/30 space-y-2 shadow-xs">
                      <div className="text-[11px] font-serif font-bold text-[#8c6b2d] dark:text-[#d4af37] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#8c6b2d]" />
                        Personaliza tu oración con tu situación actual:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentPrayer.fields.map((f) => (
                          <div key={f.key} className="space-y-0.5">
                            <label className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">
                              {f.label}:
                            </label>
                            <input
                              type="text"
                              placeholder={f.placeholder}
                              value={fieldValues[f.key] || ''}
                              onChange={(e) => handleFieldChange(f.key, e.target.value)}
                              className="w-full px-2.5 py-1 text-xs bg-white dark:bg-black/50 border border-[#d4af37]/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8c6b2d] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prayer Text Parchment Card */}
                  <div className="relative p-4 sm:p-6 bg-gradient-to-b from-[#fffefc] via-[#fcf9f2] to-[#f7f0e4] dark:from-neutral-900 dark:via-neutral-900/90 dark:to-neutral-950 rounded-2xl border border-[#d4af37]/40 shadow-sm">
                    <div className="space-y-3">
                      <div className="text-center pb-2 border-b border-[#d4af37]/20">
                        <h4 className="font-serif font-bold text-sm sm:text-lg text-neutral-900 dark:text-[#f2efe9]">
                          {currentPrayer.title}
                        </h4>
                      </div>

                      <div className={`font-serif leading-relaxed whitespace-pre-wrap text-neutral-800 dark:text-neutral-200 selection:bg-[#8c6b2d]/30 ${
                        fontSize === 'normal' ? 'text-xs sm:text-sm' :
                        fontSize === 'large' ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
                      }`}>
                        {getRenderedText(currentPrayer)}
                      </div>

                      <div className="pt-3 text-center border-t border-[#d4af37]/20">
                        <p className="text-[11px] font-serif italic text-neutral-500 dark:text-neutral-400">
                          "En mi indefensión radica mi seguridad. Dios va conmigo dondequiera que voy."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Footer */}
                <div className="p-2.5 sm:p-3 border-t border-[#d4af37]/20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md flex items-center justify-between gap-2 flex-shrink-0">
                  <button
                    onClick={handleSaveNote}
                    disabled={!onSaveAsNote}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8c6b2d]/10 hover:bg-[#8c6b2d]/20 text-[#8c6b2d] dark:text-[#d4af37] text-xs font-semibold transition-all cursor-pointer border border-[#8c6b2d]/30 active:scale-95"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Guardar en Notas</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {savedToast && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                        ✓ Guardada
                      </span>
                    )}
                    {copied && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                        ✓ Copiada
                      </span>
                    )}
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#8c6b2d] to-[#6b5020] hover:from-[#7c5d25] hover:to-[#59421a] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
