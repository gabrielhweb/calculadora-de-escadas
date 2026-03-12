
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Calculator from './pages/Calculator';
import Contract from './pages/Contract';
import SavedQuotes from './pages/SavedQuotes';
import { ContractsList } from './pages/ContractsList';
import ProductionQueue from './pages/productionQueue';
import { AuthProvider } from './components/AuthProvider';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Calculator />} />
            <Route path="contrato" element={<Contract />} />
            <Route path="salvos" element={<SavedQuotes />} />
            <Route path="contratos" element={<ContractsList />} />
            <Route path="fila" element={<ProductionQueue />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
