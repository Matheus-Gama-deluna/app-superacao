import React, { useState, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface PersonalAgentFabProps {
  onClick: () => void;
  isOpen: boolean;
  activeContextText?: string;
  hasActiveProposal?: boolean;
}

export const PersonalAgentFab: React.FC<PersonalAgentFabProps> = ({
  onClick,
  isOpen,
  activeContextText,
  hasActiveProposal = false,
}) => {
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 120 && currentScrollY > lastScrollY + 10) {
        setIsScrolledDown(true);
      } else if (currentScrollY < lastScrollY - 10 || currentScrollY <= 80) {
        setIsScrolledDown(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (isOpen) return null;

  return (
    <aside
      aria-label="Atalho do Assistente Personal IA"
      className="fixed bottom-20 right-4 z-40 transition-all duration-300 pointer-events-auto"
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="Conversar com Personal IA"
        className={`group relative flex items-center gap-2 bg-[#1B4332] hover:bg-[#12372A] text-white shadow-xl hover:shadow-2xl rounded-full border-2 border-[#D8F3DC]/30 transition-all duration-300 cursor-pointer active:scale-95 ${
          isScrolledDown ? 'p-3' : 'px-4 py-3'
        }`}
      >
        {/* Pulsing notification badge if has active proposal */}
        {hasActiveProposal && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
          </span>
        )}

        {/* AI Icon with gentle glow */}
        <div className="relative flex items-center justify-center">
          <Bot className="w-5 h-5 text-[#D8F3DC] group-hover:scale-110 transition-transform" />
          <Sparkles className="w-2.5 h-2.5 text-amber-300 absolute -top-1 -right-1" />
        </div>

        {/* Collapsible Label */}
        {!isScrolledDown && (
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight tracking-wide flex items-center gap-1">
              Personal IA
              <span className="text-[10px] font-normal text-[#D8F3DC]/80 bg-[#2D6A4F]/60 px-1.5 py-0.2 rounded-full">
                GLM-5.3
              </span>
            </span>
            {activeContextText && (
              <span className="text-[10px] text-[#D8F3DC]/70 line-clamp-1 max-w-[130px]">
                {activeContextText}
              </span>
            )}
          </div>
        )}
      </button>
    </aside>
  );
};
