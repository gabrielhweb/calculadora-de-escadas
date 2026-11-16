import React, { useEffect, useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

// O e-mail pode estar autorizado no site e mesmo assim o Firestore bloquear os dados:
// as regras exigem um documento com o UID da conta na coleção "admins".
// Sem isso as telas ficam vazias sem erro nenhum; este aviso mostra o que cadastrar.
const AdminAccessBanner: React.FC = () => {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBlocked(false);
    if (!user) return;
    getDocs(query(collection(db, 'contracts'), limit(1)))
      .catch((err) => {
        if (err?.code === 'permission-denied') setBlocked(true);
      });
  }, [user]);

  if (!user || !blocked) return null;

  const copyUid = async () => {
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copie o UID:', user.uid);
    }
  };

  return (
    <div className="m-4 p-4 border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 text-sm">
      <p className="font-bold text-base mb-1">Esta conta ainda não está liberada no banco de dados</p>
      <p className="mb-2">
        Você entrou com <strong>{user.email}</strong>, mas o Firebase não deixa essa conta ver os contratos,
        por isso as telas aparecem vazias.
      </p>
      <p className="mb-2">
        Pra liberar: Firebase → Firestore → Dados → coleção <strong>admins</strong> → Adicionar documento,
        e no "ID do documento" cole este UID:
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="px-2 py-1 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 font-mono break-all">
          {user.uid}
        </code>
        <button
          type="button"
          onClick={copyUid}
          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold"
        >
          {copied ? 'Copiado!' : 'Copiar UID'}
        </button>
      </div>
    </div>
  );
};

export default AdminAccessBanner;
