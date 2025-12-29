
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import Contract from './pages/Contract';
import SavedQuotes from './pages/SavedQuotes';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';

// --- COMPONENTE DE PROTEÇÃO DE ROTA ---
// Se não tiver login, redireciona para /login.
const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const isAuth = localStorage.getItem('zilinski_auth');
  const permissionsStr = localStorage.getItem('zilinski_permissions');
  const userRole = localStorage.getItem('zilinski_role');
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Verificação simples de rota proibida (opcional, já que o menu esconde)
  // Se quiser bloquear via URL direta:
  if (permissionsStr && userRole !== 'admin') {
      const perms = JSON.parse(permissionsStr);
      const currentPath = location.pathname;
      
      // Se não for admin e tentar acessar algo que não tem permissão
      // Exceção: '/' (Home) e '/obra' (Detalhes) geralmente liberados se tiver login
      if (currentPath !== '/' && !currentPath.startsWith('/obra') && !perms.includes(currentPath)) {
          // Se tentar acessar algo proibido, joga pro dashboard ou home
          return <Navigate to="/" replace />;
      }
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública: Apenas o Login */}
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas */}
        <Route element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }>
          <Route path="/" element={<Home />} />
          <Route path="/calculadora" element={<Calculator />} />
          <Route path="/contrato" element={<Contract />} />
          <Route path="/salvos" element={<SavedQuotes />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/obra/:id" element={<ProjectDetails />} />
        </Route>

        {/* Catch all - volta pro login se rota nao existe */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
