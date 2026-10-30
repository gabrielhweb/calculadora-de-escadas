import React from 'react';

// Ícones de linha do site (substituem os emojis). Tamanho acompanha o texto em volta.
const ICONS: Record<string, string> = {
  scale: 'M12 3v18M7 21h10M5 7h14M5 7l-3 6a3 3 0 006 0zM19 7l-3 6a3 3 0 006 0z',
  barrier: 'M3 8h18v6H3zM6 14v6M18 14v6M7 8l4 6M13 8l4 6',
  pin: 'M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11zM12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  pencil: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  clipboard: 'M9 3h6v3H9zM9 4.5H6V21h12V4.5h-3M9 11h6M9 15h4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  check: 'M5 12l4 4 10-10',
  cash: 'M3 7h18v10H3zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM6 10v4M18 10v4',
  left: 'M19 12H5M11 6l-6 6 6 6',
  right: 'M5 12h14M13 6l6 6-6 6',
  up: 'M12 19V5M6 11l6-6 6 6',
  upRight: 'M7 17L17 7M9 7h8v8',
  upLeft: 'M17 17L7 7M15 7H7v8',
  turnLeft: 'M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3',
  turnRight: 'M15 14l5-5-5-5M20 9H9a5 5 0 000 10h3',
  ruler: 'M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  fire: 'M12 3s5 5 5 10a5 5 0 01-10 0c0-3 2-5 2-5s0 3 2 3c0-4 1-8 1-8z',
  hourglass: 'M6 3h12M6 21h12M7 3c0 5 10 7 10 9s-10 4-10 9M17 3c0 5-10 7-10 9s10 4 10 9',
  file: 'M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h4',
  camera: 'M4 7h4l2-3h4l2 3h4v12H4zM12 10a3.5 3.5 0 100 7 3.5 3.5 0 000-7z',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
  square: 'M4 4h16v16H4zM8 8h8v8H8z',
  chartDown: 'M3 3v18h18M7 9l4 4 3-3 5 5',
  info: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v5M12 8h.01',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  gear: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  truck: 'M3 6h11v10H3zM14 9h4l3 3v4h-7M7 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  car: 'M5 16h14v-4l-2-5H7l-2 5zM5 16v2M19 16v2M5 12h14M8 14h.01M16 14h.01',
  printer: 'M7 8V3h10v5M5 17H3V8h18v9h-2M7 14h10v7H7z',
  cart: 'M3 4h2l2.4 11h10.2L20 7H6.2M9 20a1 1 0 100-2 1 1 0 000 2zM17 20a1 1 0 100-2 1 1 0 000 2z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 018 0v4',
  calc: 'M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
  warning: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  refresh: 'M20 11a8 8 0 00-14-5L4 8M4 4v4h4M4 13a8 8 0 0014 5l2-2M20 20v-4h-4',
  fuel: 'M4 21V5a2 2 0 012-2h6a2 2 0 012 2v16M3 21h12M6 8h6M14 10h2a2 2 0 012 2v4a1.5 1.5 0 003 0V8l-3-3',
  x: 'M6 6l12 12M18 6L6 18',
  bolt: 'M13 3L5 14h6l-1 7 8-11h-6z',
  snow: 'M12 2v20M4 7l16 10M20 7L4 17',
  stair: 'M3 21h5v-4h4v-4h4V9h4V5',
  save: 'M5 3h11l3 3v15H5zM8 3v5h7V3M8 21v-7h8v7',
  robot: 'M6 8h12v11H6zM12 4v4M9 13h.01M15 13h.01M9 16h6',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  users: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M16 5a3 3 0 010 6M21 20a6 6 0 00-4-5.6',
  plus: 'M12 5v14M5 12h14',
  play: 'M7 4l13 8-13 8z',
  factory: 'M3 21V10l6 4v-4l6 4V5h4v16zM3 21h18',
  door: 'M6 21V4a1 1 0 011-1h10a1 1 0 011 1v17M3 21h18M14 12h.01',
  wrench: 'M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 3',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  clip: 'M20 11l-8 8a5 5 0 01-7-7l8-8a3.5 3.5 0 015 5l-8 8a2 2 0 01-3-3l7-7',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  chevronDown: 'M6 9l6 6 6-6',
  eyeOff: 'M3 3l18 18M10.6 6.1A10 10 0 0112 6c6 0 10 6 10 6a17 17 0 01-3 3.6M6.6 6.6C3.9 8.3 2 12 2 12s4 7 10 7c1.7 0 3.2-.5 4.5-1.2M10 10a3 3 0 004 4',
};

const Icon: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`inline-block w-[1.1em] h-[1.1em] align-[-0.2em] shrink-0 ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={ICONS[name] || ICONS.info} />
  </svg>
);

export default Icon;
