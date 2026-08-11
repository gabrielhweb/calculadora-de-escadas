
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Calculator from './pages/Calculator';
import Contract from './pages/Contract';
import SavedQuotes from './pages/SavedQuotes';
import { ContractsList } from './pages/ContractsList';
import ProductionQueuePage from './pages/ProductionQueuePage';
import VisitReceipt from './pages/VisitReceipt';
import InstallationReceipt from './pages/InstallationReceipt';
import CustomPaymentReceipt from './pages/CustomPaymentReceipt';
import Carriers from './pages/Carriers';
import { DeliveriesTable } from './pages/DeliveriesTable';
import { AuthProvider } from './components/AuthProvider';
import { useEffect } from 'react';
import { getDocFromServer, doc } from 'firebase/firestore';
import { db } from './firebase';
import { GlobalErrorCatcher } from './components/GlobalErrorCatcher';

function App() {
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  return (
    <AuthProvider>
      <GlobalErrorCatcher />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Calculator />} />
            <Route path="contrato" element={<Contract />} />
            <Route path="salvos" element={<SavedQuotes />} />
            <Route path="contratos" element={<ContractsList />} />
            <Route path="fila" element={<ProductionQueuePage />} />
            <Route path="recibo-pagamento" element={<CustomPaymentReceipt />} />
            <Route path="recibo-instalacao" element={<InstallationReceipt />} />
            <Route path="recibo-visita" element={<VisitReceipt />} />
            <Route path="transportadoras" element={<Carriers />} />
            <Route path="tabela-entregas" element={<DeliveriesTable />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
