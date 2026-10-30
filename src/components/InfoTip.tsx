import React, { useEffect, useRef, useState } from 'react';

// Ícone "i" com explicação. Abre ao passar o mouse (computador) ou ao tocar (celular).
// O balão usa posição fixa pra não ser cortado por menus com rolagem.
const InfoTip: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const width = 220;
    const left = Math.max(8, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - 8));
    setPos({ top: r.bottom + 6, left });
  };
  const hide = () => setPos(null);

  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => {
      if (ref.current && e.target instanceof Node && ref.current.contains(e.target)) return;
      hide();
    };
    document.addEventListener('click', close);
    window.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('click', close);
      window.removeEventListener('scroll', hide, true);
    };
  }, [pos]);

  return (
    <span
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={text}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      // No celular o toque também dispara mouseenter, então o clique só abre; fecha ao tocar fora
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); show(); }}
      className={`inline-flex items-center justify-center shrink-0 cursor-help text-gray-400 hover:text-highlight dark:text-gray-500 dark:hover:text-highlight ${className}`}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </svg>
      {pos && (
        <span
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 220 }}
          className="z-[100] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs leading-snug font-normal normal-case tracking-normal text-left text-gray-700 dark:text-gray-200 shadow-lg pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  );
};

export default InfoTip;
