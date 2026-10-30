import React from 'react';
import InfoTip from './InfoTip';

// Título padrão das páginas, com o "i" de explicação ao lado.
const PageTitle: React.FC<{ info?: string; className?: string; children: React.ReactNode }> = ({ info, className = '', children }) => (
  <h1 className={`inline-flex items-center gap-2 text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white ${className}`}>
    <span>{children}</span>
    {info && <InfoTip text={info} />}
  </h1>
);

export default PageTitle;
