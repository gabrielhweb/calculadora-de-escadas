import React, { useEffect, useState } from 'react';

// Campo do raio (km) das entregas próximas. Guarda o texto enquanto digita
// (dá pra apagar e escrever outro número) e só avisa quando é um número válido.
const RadiusInput: React.FC<{ value: number; onChange: (km: number) => void; className?: string }> = ({ value, onChange, className }) => {
  const [text, setText] = useState(String(value));
  useEffect(() => { if (Number(text.replace(',', '.')) !== value) setText(String(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={e => {
        const t = e.target.value.replace(/[^\d.,]/g, '');
        setText(t);
        const km = Number(t.replace(',', '.'));
        if (km > 0) onChange(km);
      }}
      onBlur={() => setText(String(value))}
      onFocus={e => e.target.select()}
      className={className || 'w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center'}
      aria-label="Raio em km"
    />
  );
};

export default RadiusInput;
