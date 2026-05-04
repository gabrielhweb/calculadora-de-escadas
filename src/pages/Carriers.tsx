import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { Carrier } from '../types';

// Array com os estados (UFs)
const ufs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function Carriers() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    baseLocation: '',
    statesServed: [] as string[],
    averagePrice: ''
  });

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'transportadoras'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Carrier[] = [];
      snapshot.forEach(doc => {
        loaded.push({ id: doc.id, ...doc.data() } as Carrier);
      });
      // Sort alphabetical
      loaded.sort((a, b) => a.name.localeCompare(b.name));
      setCarriers(loaded);
    }, (error) => {
      console.error("Error loading carriers:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const openAddModal = () => {
    setEditingCarrier(null);
    setFormData({
      name: '',
      contact: '',
      baseLocation: '',
      statesServed: [],
      averagePrice: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Carrier) => {
    setEditingCarrier(c);
    setFormData({
      name: c.name,
      contact: c.contact || '',
      baseLocation: c.baseLocation || '',
      statesServed: c.statesServed || [],
      averagePrice: c.averagePrice ? c.averagePrice.toString() : ''
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

    const price = parseFloat(formData.averagePrice);

    const payload = {
      name: formData.name,
      contact: formData.contact,
      baseLocation: formData.baseLocation,
      statesServed: formData.statesServed,
      averagePrice: isNaN(price) ? 0 : price
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
          📦 Transportadoras
        </h1>
        <button 
          onClick={openAddModal}
          className="bg-highlight hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded shadow-md transition-colors"
        >
          + Nova Transportadora
        </button>
      </div>

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
                <div className="flex items-center text-sm">
                  <span className="font-semibold text-gray-600 dark:text-gray-300 w-24">Preço Médio:</span>
                  <span className="text-gray-800 dark:text-gray-100 font-mono">
                    {carrier.averagePrice ? `R$ ${carrier.averagePrice.toFixed(2).replace('.', ',')}` : '-'}
                  </span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Preço Médio Estimado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.averagePrice}
                    onChange={e => setFormData({ ...formData, averagePrice: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-highlight focus:border-highlight outline-none transition-all font-mono"
                    placeholder="Ex: 850.00"
                  />
                </div>
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
