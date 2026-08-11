import React, { useState, useEffect } from 'react';

export const GlobalErrorCatcher: React.FC = () => {
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Ignora avisos comuns do react devtools ou de extensões
      if (event.message.includes('ResizeObserver')) return;
      
      setErrors(prev => [...prev, `Erro: ${event.message} no arquivo ${event.filename} (Linha ${event.lineno})`]);
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      let msg = typeof event.reason === 'string' ? event.reason : event.reason?.message || "Erro desconhecido";
      setErrors(prev => [...prev, `Erro (Assíncrono): ${msg}`]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full print:hidden pointer-events-none">
      {errors.map((err, i) => (
        <div key={i} className="bg-red-600 text-white p-4 rounded-lg shadow-xl flex justify-between items-start gap-3 text-sm pointer-events-auto border border-red-800">
          <div className="flex-1 font-mono break-words">
            <strong>Ocorreu um erro:</strong>
            <div className="mt-1 opacity-90 text-xs">{err}</div>
          </div>
          <button 
            onClick={() => setErrors(prev => prev.filter((_, index) => index !== i))}
            className="text-white hover:bg-red-700 rounded p-1 transition-colors flex-shrink-0"
            title="Fechar aviso"
          >
            ✕
          </button>
        </div>
      ))}
      {errors.length > 1 && (
        <button 
          onClick={() => setErrors([])}
          className="bg-red-800 text-white text-xs p-2 rounded shadow hover:bg-red-900 pointer-events-auto w-full font-bold"
        >
          Limpar Todos os Erros
        </button>
      )}
    </div>
  );
};
