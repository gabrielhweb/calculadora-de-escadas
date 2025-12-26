
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import Contract from './pages/Contract';
import SavedQuotes from './pages/SavedQuotes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="calculadora" element={<Calculator />} />
          <Route path="contrato" element={<Contract />} />
          <Route path="salvos" element={<SavedQuotes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
