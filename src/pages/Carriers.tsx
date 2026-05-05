import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, setDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { Carrier, StatePrice } from '../types';
import { useCarriers } from '../hooks/useCarriers';

// Array com os estados (UFs)
const ufs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function Carriers() {
  const { carriers, statePrices } = useCarriers();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'carriers' | 'prices'>('carriers');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    baseLocation: '',
    statesServed: [] as string[]
  });

  const [localPrices, setLocalPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    // Populate local prices based on fetched statePrices
    const pricesObj: Record<string, string> = {};
    statePrices.forEach(sp => {
      pricesObj[sp.id] = sp.price.toString();
    });
    setLocalPrices(pricesObj);
  }, [statePrices]);

  const openAddModal = () => {
    setEditingCarrier(null);
    setFormData({
      name: '',
      contact: '',
      baseLocation: '',
      statesServed: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Carrier) => {
    setEditingCarrier(c);
    setFormData({
      name: c.name,
      contact: c.contact || '',
      baseLocation: c.baseLocation || '',
      statesServed: c.statesServed || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente excluir esta transportadora?")) {
      try {
        await deleteDoc(doc(db, 'transportadoras', id));
      } catch (error) {
        console.error("Erro ao deletar: ", error);
        alert("Erro ao excluir. Falta de permissões?");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("O nome da transportadora é obrigatório.");
      return;
    }

    const payload = {
      name: formData.name,
      contact: formData.contact,
      baseLocation: formData.baseLocation,
      statesServed: formData.statesServed
    };

    try {
      if (editingCarrier) {
        await updateDoc(doc(db, 'transportadoras', editingCarrier.id), payload);
      } else {
        await addDoc(collection(db, 'transportadoras'), payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar: ", error);
      alert("Erro ao salvar a transportadora.");
    }
  };

  const toggleState = (uf: string) => {
    setFormData(prev => {
      const current = prev.statesServed;
      if (current.includes(uf)) {
        return { ...prev, statesServed: current.filter(s => s !== uf) };
      } else {
        return { ...prev, statesServed: [...current, uf] };
      }
    });
  };

  const handlePriceChange = (uf: string, value: string) => {
    setLocalPrices(prev => ({ ...prev, [uf]: value }));
  };

  const handleSavePrice = async (uf: string) => {
    const val = parseFloat(localPrices[uf]);
    if (isNaN(val)) return;

    try {
      await setDoc(doc(db, 'state_prices', uf), { price: val });
      alert(`Preço para ${uf} salvo com sucesso!`);
    } catch (err) {
      console.error("Erro ao salvar preço", err);
      alert("Erro ao salvar preço");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
          🚚 Gestão de Fretes
        </h1>
        {activeTab === 'carriers' && (
          <button 
            onClick={openAddModal}
            className="bg-highlight hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded shadow-md transition-colors"
          >
            + Nova Transportadora
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('carriers')}
          className={`py-2 px-4 font-bold text-sm uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'carriers' ? 'border-highlight text-highlight' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Transportadoras
        </button>
        <button
          onClick={() => setActiveTab('prices')}
          className={`py-2 px-4 font-bold text-sm uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'prices' ? 'border-highlight text-highlight' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Preços por Estado
        </button>
      </div>

      {activeTab === 'carriers' && (
        <>
          {carriers.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Nenhuma transportadora cadastrada no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {carriers.map(carrier => (
                <div key={carrier.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate" title={carrier.name}>{carrier.name}</h3>
                    <p className="text-sm font-medium text-highlight mt-1">{carrier.baseLocation ? `Base: ${carrier.baseLocation}` : 'Base: Não informada'}</p>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center text-sm">
                      <span className="font-semibold text-gray-600 dark:text-gray-300 w-24">Contato:</span>
                      <span className="text-gray-800 dark:text-gray-100 truncate">{carrier.contact || '-'}</span>
                    </div>
                    <div className="pt-2">
                      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 block mb-2">Estados Atendidos:</span>
                      <div className="flex flex-wrap gap-1">
                        {carrier.statesServed && carrier.statesServed.length > 0 ? (
                          carrier.statesServed.map(uf => (
                            <span key={uf} className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded font-bold">
                              {uf}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Nenhum</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 px-5 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                    <button 
                      onClick={() => openEditModal(carrier)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(carrier.id)}
                      className="text-sm font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'prices' && (
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
           <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
             <h2 className="text-lg font-bold text-gray-800 dark:text-white">Preço Estimado por Estado (UF)</h2>
             <p className="text-sm text-gray-500 mt-1">Configure o valor médio de frete que deve ser usado no orçamento ao selecionar um estado de destino da carga.</p>
           </div>
           <div className="p-0">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider py-2">
                   <th className="p-4 py-3 font-bold">Estado (UF)</th>
                   <th className="p-4 py-3 font-bold">Valor Base Estimado (R$)</th>
                   <th className="p-4 py-3 font-bold text-right">Ação</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                 {ufs.map(uf => (
                   <tr key={uf} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                     <td className="p-4 text-sm font-bold text-gray-800 dark:text-gray-200">
                       <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded w-12 text-center">{uf}</span>
                     </td>
                     <td className="p-4">
                       <input 
                         type="number"
                         step="0.01"
                         min="0"
                         className="w-full max-w-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-highlight focus:border-highlight outline-none font-mono"
                         placeholder="Ex: 800.00"
                         value={localPrices[uf] || ''}
                         onChange={(e) => handlePriceChange(uf, e.target.value)}
                       />
                     </td>
                     <td className="p-4 text-right">
                       <button
                         onClick={() => handleSavePrice(uf)}
                         className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold shadow-sm transition-colors"
                       >
                         Salvar
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">
              {editingCarrier ? 'Editar Transportadora' : 'Nova Transportadora'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nome da Transportadora *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-highlight focus:border-highlight outline-none transition-all"
                    placeholder="Ex: Transportes Rápidos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Contato (Tel/WhatsApp)</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-highlight focus:border-highlight outline-none transition-all"
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Base Mais Próxima</label>
                <input
                  type="text"
                  value={formData.baseLocation}
                  onChange={e => setFormData({ ...formData, baseLocation: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-highlight focus:border-highlight outline-none transition-all"
                  placeholder="Ex: Campinas / SP"
                />
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-5 mt-5">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Estados Atendidos (Opcional)</label>
                <div className="flex flex-wrap gap-2">
                  {ufs.map(uf => {
                    const isSelected = formData.statesServed.includes(uf);
                    return (
                      <button
                        type="button"
                        key={uf}
                        onClick={() => toggleState(uf)}
                        className={`w-12 h-10 rounded text-sm font-bold transition-colors ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                      >
                        {uf}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-highlight hover:bg-yellow-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors"
                >
                  Salvar Transportadora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
