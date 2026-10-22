import React, { useState, useEffect, useMemo } from 'react';
import { allExercises } from '../data/catalog';
import { Play, Pause } from 'lucide-react';

interface ExerciseIllustrationProps {
  movementPattern?: string;
  modality?: string;
  images?: string[];
  exerciseName?: string;
  targetMuscle?: string;
  showPhaseToggle?: boolean;
  exerciseId?: string;
  className?: string;
}

export const ExerciseIllustration: React.FC<ExerciseIllustrationProps> = ({
  movementPattern = '',
  modality = 'forca',
  images,
  exerciseName = '',
  className = 'w-full h-44',
  showPhaseToggle = true,
  exerciseId,
}) => {
  const [imagePhase, setImagePhase] = useState<number>(0); // 0 = Início, 1 = Pico
  const [hasImageError, setHasImageError] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Busca imagens no catálogo caso a prop venha vazia ou indefinida
  const resolvedImages = useMemo(() => {
    if (images && images.length > 0) return images;
    if (exerciseId || exerciseName) {
      const match = allExercises.find(
        (e) =>
          (exerciseId && e.id === exerciseId) ||
          (exerciseName && (e.name_pt === exerciseName || e.name_en === exerciseName))
      );
      if (match?.images && match.images.length > 0) {
        return match.images;
      }
    }
    return images || [];
  }, [images, exerciseId, exerciseName]);

  // Reseta estado sempre que o exercício mudar
  useEffect(() => {
    setHasImageError(false);
    setImagePhase(0);
    setIsAutoPlaying(false);
  }, [exerciseId, exerciseName, images]);

  // Pré-carrega ambas as fases para troca instantânea sem flash
  useEffect(() => {
    if (resolvedImages && resolvedImages.length > 1) {
      resolvedImages.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [resolvedImages]);

  // Reprodução em loop alternando Início <-> Pico
  useEffect(() => {
    if (!isAutoPlaying || resolvedImages.length < 2) return;
    const interval = setInterval(() => {
      setImagePhase((prev) => (prev === 0 ? 1 : 0));
    }, 1200);
    return () => clearInterval(interval);
  }, [isAutoPlaying, resolvedImages.length]);

  const hasPhotos = resolvedImages && resolvedImages.length > 0 && !hasImageError;
  const currentPhotoUrl = hasPhotos ? resolvedImages[Math.min(imagePhase, resolvedImages.length - 1)] : null;

  // Se tiver fotos reais disponíveis localmente
  if (hasPhotos && currentPhotoUrl) {
    return (
      <div
        onClick={() => {
          if (resolvedImages.length > 1 && !isAutoPlaying) {
            setImagePhase((prev) => (prev === 0 ? 1 : 0));
          }
        }}
        className={`group relative bg-white rounded-2xl overflow-hidden flex flex-col items-center justify-center border border-[#C9DBD3] select-none cursor-pointer transition-all ${className}`}
        title="Clique para alternar entre Início e Pico de contração"
      >
        <img
          src={currentPhotoUrl}
          alt={`${exerciseName} - Fase ${imagePhase === 0 ? 'Inicial' : 'Final'}`}
          onError={() => setHasImageError(true)}
          className="w-full h-full object-contain p-2 mix-blend-multiply transition-opacity duration-200"
          loading="lazy"
        />

        {/* Controles de Fase (Início / Pico / Animar) */}
        {resolvedImages.length > 1 && showPhaseToggle && (
          <div
            className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/70 p-1 rounded-lg backdrop-blur-xs z-10 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setIsAutoPlaying(false);
                setImagePhase(0);
              }}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                imagePhase === 0 && !isAutoPlaying ? 'bg-white text-[#125F55] shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              Início
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAutoPlaying(false);
                setImagePhase(1);
              }}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                imagePhase === 1 && !isAutoPlaying ? 'bg-white text-[#125F55] shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              Pico
            </button>
            <button
              type="button"
              onClick={() => setIsAutoPlaying((prev) => !prev)}
              title={isAutoPlaying ? 'Pausar animação' : 'Animar movimento'}
              className={`p-0.5 px-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-0.5 ${
                isAutoPlaying ? 'bg-[#D9F277] text-[#125F55]' : 'text-white/80 hover:text-white'
              }`}
            >
              {isAutoPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
            </button>
          </div>
        )}

        {/* Legenda de Posição */}
        <span className="absolute bottom-2 left-2 text-[10px] font-bold text-[#125F55] bg-white/95 border border-[#C9DBD3]/60 px-2 py-0.5 rounded-md shadow-xs pointer-events-none">
          {imagePhase === 0 ? 'Fase 1: Inicial' : 'Fase 2: Contração'}
        </span>
      </div>
    );
  }

  // Fallback garantido: Ilustrações anatômicas vetoriais SVG
  const p = movementPattern.toLowerCase();
  const primaryStroke = '#125F55';
  const accentFill = '#D9F277';
  const jointStroke = '#203826';

  // 1. Agachamentos e Pernas
  if (p.includes('agachar') || p.includes('lunge') || p.includes('afundo') || p.includes('quadriceps')) {
    return (
      <div className={`flex items-center justify-center bg-[#EAF3EF] rounded-2xl p-4 overflow-hidden relative ${className}`}>
        <svg viewBox="0 0 160 140" className="w-full h-full max-h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="20" y1="125" x2="140" y2="125" stroke="#C9DBD3" strokeWidth="2" strokeDasharray="4 4" />
          <ellipse cx="78" cy="88" rx="20" ry="12" fill={accentFill} opacity="0.6" />
          <circle cx="68" cy="40" r="10" stroke={primaryStroke} strokeWidth="3.5" fill="#FFFFFF" />
          <line x1="68" y1="50" x2="72" y2="78" stroke={primaryStroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M 69 58 L 98 62" stroke={primaryStroke} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 72 78 L 94 85 L 86 122" stroke={jointStroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 72 78 L 60 88 L 62 122" stroke={primaryStroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <line x1="82" y1="122" x2="98" y2="122" stroke={primaryStroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M 115 65 L 115 95 M 111 72 L 115 65 L 119 72 M 111 88 L 115 95 L 119 88" stroke="#5B7170" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="absolute bottom-2 right-3 text-[11px] font-semibold text-[#125F55] bg-white/90 px-2 py-0.5 rounded-md shadow-xs">
          Quadríceps & Glúteos
        </span>
      </div>
    );
  }

  // 2. Empurrar (Flexão de Braço, Parede ou Chão)
  if (p.includes('empurrar') || p.includes('flexao') || p.includes('peitoral')) {
    return (
      <div className={`flex items-center justify-center bg-[#EAF3EF] rounded-2xl p-4 overflow-hidden relative ${className}`}>
        <svg viewBox="0 0 160 140" className="w-full h-full max-h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="20" y1="120" x2="140" y2="120" stroke="#C9DBD3" strokeWidth="2" strokeDasharray="4 4" />
          <ellipse cx="64" cy="74" rx="16" ry="10" fill={accentFill} opacity="0.6" />
          <circle cx="42" cy="62" r="9" stroke={primaryStroke} strokeWidth="3.5" fill="#FFFFFF" />
          <line x1="48" y1="68" x2="118" y2="98" stroke={primaryStroke} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 58 72 L 68 88 L 64 118" stroke={jointStroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="120" cy="116" r="3" fill={primaryStroke} />
          <line x1="116" y1="98" x2="120" y2="116" stroke={primaryStroke} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 45 95 L 45 80 M 41 85 L 45 80 L 49 85" stroke="#5B7170" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="absolute bottom-2 right-3 text-[11px] font-semibold text-[#125F55] bg-white/90 px-2 py-0.5 rounded-md shadow-xs">
          Peitoral & Braços
        </span>
      </div>
    );
  }

  // 3. Puxar / Remadas / Faixas Elásticas
  if (p.includes('puxar') || p.includes('remada') || p.includes('dorsal')) {
    return (
      <div className={`flex items-center justify-center bg-[#EAF3EF] rounded-2xl p-4 overflow-hidden relative ${className}`}>
        <svg viewBox="0 0 160 140" className="w-full h-full max-h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="30" y1="40" x2="30" y2="120" stroke="#C9DBD3" strokeWidth="4" strokeLinecap="round" />
          <path d="M 32 75 Q 55 70 82 72" stroke="#125F55" strokeWidth="2.5" strokeDasharray="3 3" />
          <ellipse cx="94" cy="72" rx="14" ry="12" fill={accentFill} opacity="0.6" />
          <circle cx="94" cy="42" r="9" stroke={primaryStroke} strokeWidth="3.5" fill="#FFFFFF" />
          <line x1="94" y1="52" x2="88" y2="88" stroke={primaryStroke} strokeWidth="4" strokeLinecap="round" />
          <path d="M 90 60 L 82 72 L 102 70" stroke={jointStroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 88 88 L 76 122 M 88 88 L 104 122" stroke={primaryStroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 112 68 L 124 68 M 120 64 L 124 68 L 120 72" stroke="#5B7170" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="absolute bottom-2 right-3 text-[11px] font-semibold text-[#125F55] bg-white/90 px-2 py-0.5 rounded-md shadow-xs">
          Dorsais & Escápulas
        </span>
      </div>
    );
  }

  // 4. Core / Pranchas / Abdômen
  if (p.includes('core') || p.includes('prancha') || p.includes('abdominal')) {
    return (
      <div className={`flex items-center justify-center bg-[#EAF3EF] rounded-2xl p-4 overflow-hidden relative ${className}`}>
        <svg viewBox="0 0 160 140" className="w-full h-full max-h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="15" y1="115" x2="145" y2="115" stroke="#C9DBD3" strokeWidth="2" strokeDasharray="4 4" />
          <ellipse cx="78" cy="85" rx="20" ry="8" fill={accentFill} opacity="0.7" />
          <circle cx="36" cy="74" r="8" stroke={primaryStroke} strokeWidth="3" fill="#FFFFFF" />
          <line x1="42" y1="78" x2="124" y2="95" stroke={primaryStroke} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 52 82 L 48 114 L 36 114" stroke={jointStroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="124" y1="95" x2="128" y2="114" stroke={primaryStroke} strokeWidth="3.5" strokeLinecap="round" />
        </svg>
        <span className="absolute bottom-2 right-3 text-[11px] font-semibold text-[#125F55] bg-white/90 px-2 py-0.5 rounded-md shadow-xs">
          Estabilidade do Core
        </span>
      </div>
    );
  }

  // 5. Mobilidade & Alongamento
  if (modality === 'mobilidade' || modality === 'alongamento' || p.includes('mobilidade') || p.includes('alongamento')) {
    return (
      <div className={`flex items-center justify-center bg-[#EAF3EF] rounded-2xl p-4 overflow-hidden relative ${className}`}>
        <svg viewBox="0 0 160 140" className="w-full h-full max-h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="25" y="112" width="110" height="6" rx="3" fill="#C9DBD3" />
          <circle cx="80" cy="70" r="32" stroke={accentFill} strokeWidth="2" strokeDasharray="6 4" opacity="0.8" />
          <circle cx="48" cy="62" r="8" stroke={primaryStroke} strokeWidth="3" fill="#FFFFFF" />
          <path d="M 54 68 Q 78 58 102 74" stroke={jointStroke} strokeWidth="4" strokeLinecap="round" fill="none" />
          <line x1="56" y1="72" x2="52" y2="112" stroke={primaryStroke} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 102 74 L 104 94 L 118 112" stroke={primaryStroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 80 40 Q 86 46 80 52" stroke="#5B7170" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="absolute bottom-2 right-3 text-[11px] font-semibold text-[#125F55] bg-white/90 px-2 py-0.5 rounded-md shadow-xs">
          Recuperação & Fluidez
        </span>
      </div>
    );
  }

  // 6. Caminhada / Cardio
  return (
    <div className={`flex items-center justify-center bg-[#EAF3EF] rounded-2xl p-4 overflow-hidden relative ${className}`}>
      <svg viewBox="0 0 160 140" className="w-full h-full max-h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="124" x2="140" y2="124" stroke="#C9DBD3" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="80" cy="72" r="30" fill={accentFill} opacity="0.35" />
        <circle cx="75" cy="40" r="9" stroke={primaryStroke} strokeWidth="3" fill="#FFFFFF" />
        <line x1="75" y1="49" x2="78" y2="82" stroke={primaryStroke} strokeWidth="4" strokeLinecap="round" />
        <path d="M 76 58 L 62 70 M 76 58 L 92 68" stroke={primaryStroke} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 78 82 L 64 102 L 56 124 M 78 82 L 95 104 L 105 124" stroke={jointStroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute bottom-2 right-3 text-[11px] font-semibold text-[#125F55] bg-white/90 px-2 py-0.5 rounded-md shadow-xs">
        Ritmo & Respiração
      </span>
    </div>
  );
};
