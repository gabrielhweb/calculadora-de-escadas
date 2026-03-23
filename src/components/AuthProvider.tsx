import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthStateChanged, signInWithPopup, googleProvider, signOut } from '../firebase';

// Lista de e-mails autorizados
export const AUTHORIZED_EMAILS = [
  'zilinskidistribuidora@gmail.com',
  'somarcilioz@gmail.com',
  'gaguisilva15@gmail.com'
];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Se tiver usuário logado, vamos verificar se o e-mail está na lista
      if (currentUser && currentUser.email) {
        if (!AUTHORIZED_EMAILS.includes(currentUser.email)) {
          // Se não estiver na lista, desloga imediatamente
          console.warn("Acesso bloqueado para o e-mail:", currentUser.email);
          await signOut(auth);
          setUser(null);
        } else {
          // E-mail autorizado
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;
      
      // Verifica na hora do login também para dar o alerta
      if (email && !AUTHORIZED_EMAILS.includes(email)) {
        alert("Acesso negado: Este e-mail não tem permissão para acessar o sistema.");
        await signOut(auth);
      }
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // O usuário apenas fechou o popup, não é um erro real.
        console.log('Login cancelado pelo usuário.');
      } else {
        console.error('Erro ao fazer login:', error);
        alert(`Ocorreu um erro ao tentar fazer login: ${error.message || error.code}. Tente novamente.`);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
