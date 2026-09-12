import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import { BookTheme, BookPageData } from '../types';
import { THEME_CONFIG } from '../constants';

interface AudioPlayerBarProps {
  pageData: BookPageData;
  currentPage: number;
  theme: BookTheme;
  activeParagraphIndex: number | null;
  onActiveParagraphChange: (index: number | null) => void;
  onClose: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  pageData,
  currentPage,
  theme,
  activeParagraphIndex,
  onActiveParagraphChange,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState<number>(1.0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const themeStyle = THEME_CONFIG[theme];

  // Filter out running headers and titles for cleaner audio flow
  const speakableLines = pageData.lines.filter(
    (l) => !/^Cap[íi]tulo\s+\d+/i.test(l) && l.trim().length > 3
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speakParagraph = (index: number) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    if (index < 0 || index >= speakableLines.length) {
      setIsPlaying(false);
      onActiveParagraphChange(null);
      return;
    }

    const textToSpeak = speakableLines[index];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.rate = rate;

    // Pick Spanish voice if available
    const voices = synthRef.current.getVoices();
    const spanishVoice = voices.find(
      (v) => v.lang.startsWith('es') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Monica') || v.name.includes('Jorge') || true)
    );
    if (spanishVoice) utterance.voice = spanishVoice;

    utterance.onstart = () => {
      setIsPlaying(true);
      // Map back to original line index in pageData
      const originalIdx = pageData.lines.indexOf(textToSpeak);
      onActiveParagraphChange(originalIdx !== -1 ? originalIdx : index);
    };

    utterance.onend = () => {
      if (index + 1 < speakableLines.length) {
        speakParagraph(index + 1);
      } else {
        setIsPlaying(false);
        onActiveParagraphChange(null);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      onActiveParagraphChange(null);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handlePlayPause = () => {
    if (!synthRef.current) return;

    if (isPlaying) {
      synthRef.current.pause();
      setIsPlaying(false);
    } else {
      if (synthRef.current.paused) {
        synthRef.current.resume();
        setIsPlaying(true);
      } else {
        const startIndex = activeParagraphIndex !== null ? activeParagraphIndex : 0;
        speakParagraph(startIndex);
      }
    }
  };

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    onActiveParagraphChange(null);
  };

  const handleNextParagraph = () => {
    const currentIdx = activeParagraphIndex !== null ? activeParagraphIndex : 0;
    speakParagraph(currentIdx + 1);
  };

  const handlePrevParagraph = () => {
    const currentIdx = activeParagraphIndex !== null ? activeParagraphIndex : 0;
    speakParagraph(Math.max(0, currentIdx - 1));
  };

  const handleToggleRate = () => {
    const rates = [0.85, 1.0, 1.2];
    const nextRate = rates[(rates.indexOf(rate) + 1) % rates.length];
    setRate(nextRate);
    if (isPlaying) {
      const currentIdx = activeParagraphIndex !== null ? activeParagraphIndex : 0;
      speakParagraph(currentIdx);
    }
  };

  return (
    <div className="fixed bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-40 w-[92%] sm:w-auto min-w-[320px] max-w-md shadow-2xl animate-fade-in">
      <div
        className={`px-4 py-2.5 rounded-2xl border ${themeStyle.border} ${themeStyle.card} ${themeStyle.text} backdrop-blur-md flex items-center justify-between gap-3 shadow-xl`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#8c6b2d]/15 text-[#8c6b2d] flex items-center justify-center">
            <Volume2 className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold font-sans-ui">Modo Audio Lectura</p>
            <p className="text-[10px] font-sans-ui text-neutral-500 truncate max-w-[120px] sm:max-w-[160px]">
              Pág. {currentPage} — {isPlaying ? 'Narrando...' : 'En pausa'}
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handlePrevParagraph}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
            title="Párrafo anterior"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={handlePlayPause}
            className="w-9 h-9 rounded-full bg-[#8c6b2d] text-white flex items-center justify-center shadow hover:scale-105 active:scale-95 cursor-pointer transition-all"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={handleNextParagraph}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
            title="Párrafo siguiente"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleRate}
            className="px-2 py-1 text-[11px] font-semibold font-sans-ui rounded-md bg-black/5 dark:bg-white/10 hover:bg-black/10 cursor-pointer transition-colors"
            title="Velocidad"
          >
            {rate}x
          </button>

          <button
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-colors ml-1"
            title="Cerrar reproductor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
