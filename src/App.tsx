
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
import CostSettingsPage from './pages/CostSettings';
import WeightCalculatorPage from './pages/WeightCalculatorPage';
import PurchasesDashboard from './pages/Purchases/PurchasesDashboard';
import ProductCatalog from './pages/Purchases/ProductCatalog';
import SupplierCatalog from './pages/Purchases/SupplierCatalog';
import NewOrder from './pages/Purchases/NewOrder';
import OrderHistory from './pages/Purchases/OrderHistory';
import PrintOrder from './pages/Purchases/PrintOrder';
import { AuthProvider } from './components/AuthProvider';
import { useEffect } from 'react';
import { getDocFromServer, doc } from 'firebase/firestore';
import { db } from './firebase';
import { insertMissingContracts } from './insertContracts';

function App() {
  useEffect(() => {
    insertMissingContracts();
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Calculator />} />
            <Route path="contrato" element={<Contract />} />
            <Route path="calculadora-peso" element={<WeightCalculatorPage />} />
            <Route path="salvos" element={<SavedQuotes />} />
            <Route path="contratos" element={<ContractsList />} />
            <Route path="fila" element={<ProductionQueuePage />} />
            <Route path="recibo-pagamento" element={<CustomPaymentReceipt />} />
            <Route path="recibo-instalacao" element={<InstallationReceipt />} />
            <Route path="recibo-visita" element={<VisitReceipt />} />
            <Route path="transportadoras" element={<Carriers />} />
            <Route path="tabela-entregas" element={<DeliveriesTable />} />
            <Route path="custos" element={<CostSettingsPage />} />
            <Route path="compras" element={<PurchasesDashboard />} />
            <Route path="compras/catalogo" element={<ProductCatalog />} />
            <Route path="compras/fornecedores" element={<SupplierCatalog />} />
            <Route path="compras/novo-pedido" element={<NewOrder />} />
            <Route path="compras/historico" element={<OrderHistory />} />
            <Route path="compras/imprimir/:id" element={<PrintOrder />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
