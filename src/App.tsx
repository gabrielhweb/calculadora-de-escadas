
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Calculator from './pages/Calculator';
import Contract from './pages/Contract';
import SavedQuotes from './pages/SavedQuotes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Calculator />} />
          <Route path="contrato" element={<Contract />} />
          <Route path="salvos" element={<SavedQuotes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
