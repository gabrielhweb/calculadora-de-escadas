import React, { useState, useEffect } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { Visita, ApiUtilizada } from '../components/visitas/types';
import { FormularioReciboPDF } from '../components/visitas/FormularioReciboPDF';
import { TabelaVisitasView } from '../components/visitas/TabelaVisitasView';
import { RotasItinerario } from '../components/visitas/RotasItinerario';

type SubpaginaVisitas = 'tabela' | 'rotas' | 'pdf';

// Chave antiga: as visitas ficavam salvas só no navegador de quem cadastrou.
// Agora ela é lida uma única vez para migrar os dados para o Firestore.
const STORAGE_KEY = 'zilinski_visitas_leads_v2';

// Lista compartilhada por todos os usuários logados (a coleção settings já é liberada nas regras do Firestore)
const VISITAS_DOC = doc(db, 'settings', 'painel_visitas');

// Leads de exemplo que vinham pré-carregados na versão antiga; não devem ir para o banco
const LEADS_EXEMPLO: Record<string, string> = {
    'lead-1': 'Dr. Roberto Antunes (Alphaville Residencial 2)',
    'lead-2': 'Mariana Silveira (Jardins)',
    'lead-3': 'Eng. Carlos Eduardo (Vila Mariana)',
    'lead-4': 'Renata Guimarães (Moema Pássaros)',
};

const normalizarVisita = (item: any): Visita => ({
    ...item,
    valorCobrado: item.valorCobrado !== undefined ? item.valorCobrado : 200,
    quandoCobrar: item.quandoCobrar || 'No dia da visita',
});

// Firestore não aceita campos undefined
const limparParaFirestore = (lista: Visita[]): Visita[] => JSON.parse(JSON.stringify(lista));

const lerVisitasLocais = (): Visita[] => {
    try {
        const salvo = localStorage.getItem(STORAGE_KEY);
        if (!salvo) return [];
        const parsed = JSON.parse(salvo);
        if (!Array.isArray(parsed)) return [];
        const contemContrato = parsed.some((p: any) =>
            p.cliente?.includes('Chalita') || p.cliente?.includes('Bergamo')
        );
        if (contemContrato) return [];
        return parsed
            .filter((p: any) => p?.id && LEADS_EXEMPLO[p.id] !== p.cliente)
            .map(normalizarVisita);
    } catch (e) {
        console.error('Erro ao ler visitas do localStorage:', e);
        return [];
    }
};

export default function VisitReceipt() {
    const { user } = useAuth();
    const [subpaginaAtiva, setSubpaginaAtiva] = useState<SubpaginaVisitas>('tabela');
    const [visitas, setVisitas] = useState<Visita[]>([]);

    const [loading, setLoading] = useState<boolean>(false);
    const [apiUtilizada, setApiUtilizada] = useState<ApiUtilizada>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [dadosReciboPreenchido, setDadosReciboPreenchido] = useState<{
        cliente: string;
        endereco: string;
        horario: string;
        data: string;
        valor: string;
    }>({
        cliente: '',
        endereco: '',
        horario: '',
        data: '',
        valor: '200.00',
    });

    // Aplica a alteração na tela na hora e grava no banco em uma transação,
    // para que duas pessoas editando ao mesmo tempo não apaguem a alteração uma da outra.
    const salvarVisitas = async (transformar: (lista: Visita[]) => Visita[]): Promise<boolean> => {
        setVisitas((prev) => transformar(prev));
        try {
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(VISITAS_DOC);
                const atuais: Visita[] = snap.exists() ? (snap.data().visitas || []) : [];
                tx.set(
                    VISITAS_DOC,
                    {
                        visitas: limparParaFirestore(transformar(atuais)),
                        updatedAt: new Date().toISOString(),
                        updatedBy: auth.currentUser?.email || null,
                    },
                    { merge: true }
                );
            });
            return true;
        } catch (e: any) {
            console.error('Erro ao salvar visitas no Firestore:', e);
            alert(`Erro ao salvar a visita no banco de dados: ${e?.message || e}`);
            return false;
        }
    };

    // Escuta a lista em tempo real: o que um usuário salva aparece para todos
    useEffect(() => {
        if (!user) return;
        const unsubscribe = onSnapshot(
            VISITAS_DOC,
            (snap) => {
                const remotas: Visita[] = snap.exists() ? (snap.data().visitas || []) : [];
                setVisitas(remotas.map(normalizarVisita));
            },
            (error) => {
                console.error('Erro ao carregar visitas do Firestore:', error);
                setErrorMsg(`Não foi possível carregar as visitas do banco de dados: ${error.message}`);
            }
        );
        return () => unsubscribe();
    }, [user]);

    // Migra uma única vez as visitas que estavam presas no navegador
    useEffect(() => {
        if (!user) return;
        const locais = lerVisitasLocais();
        if (locais.length === 0) {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }
        salvarVisitas((lista) => {
            const ids = new Set(lista.map((v) => v.id));
            return [...lista, ...locais.filter((v) => !ids.has(v.id))];
        }).then((ok) => {
            if (ok) localStorage.removeItem(STORAGE_KEY);
        });
    }, [user]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            salvarVisitas((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                if (oldIndex === -1 || newIndex === -1) return items;
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleAdicionarVisita = (nova: Visita) => {
        salvarVisitas((prev) => [...prev, nova]);
    };

    const handleAtualizarVisita = (atualizada: Visita) => {
        salvarVisitas((prev) => prev.map((v) => (v.id === atualizada.id ? atualizada : v)));
    };

    const handleRemoverVisita = (id: string) => {
        if (window.confirm('Tem certeza que deseja remover esta visita da lista?')) {
            salvarVisitas((prev) => prev.filter((v) => v.id !== id));
        }
    };

    const handleCalcularMelhorRota = async () => {
        if (visitas.length === 0) {
            alert('Adicione pelo menos 1 visita para calcular a rota.');
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            const payload = {
                visitas: visitas.map((v) => ({
                    id: v.id,
                    latitude: v.latitude,
                    longitude: v.longitude,
                })),
            };

            let response = await fetch('/api/calcular-rota-diaria', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 404) {
                response = await fetch('/calcular-rota-diaria', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Erro HTTP ${response.status}`);
            }

            const data: {
                api_utilizada: 'google' | 'mapbox' | 'osrm';
                visitas: Array<{ id: string; latitude: number; longitude: number }>;
            } = await response.json();

            const visitasMap = new Map(visitas.map((v) => [String(v.id), v]));
            const visitasReordenadas: Visita[] = [];

            for (const item of data.visitas) {
                const original = visitasMap.get(String(item.id));
                if (original) {
                    visitasReordenadas.push(original);
                }
            }

            if (visitasReordenadas.length === visitas.length) {
                // Reordena pela rota usando os ids, mantendo no fim qualquer visita que outra pessoa adicionou nesse meio tempo
                const ordem = new Map(visitasReordenadas.map((v, idx) => [String(v.id), idx]));
                salvarVisitas((lista) =>
                    [...lista].sort(
                        (a, b) => (ordem.get(String(a.id)) ?? Infinity) - (ordem.get(String(b.id)) ?? Infinity)
                    )
                );
            }

            setApiUtilizada(data.api_utilizada);
        } catch (err: any) {
            console.error('Falha ao calcular rota diária:', err);
            setErrorMsg(err.message || 'Falha na comunicação com o servidor de rotas.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelecionarParaRecibo = (v: Visita) => {
        const hoje = new Date();
        const dataFormatada = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;

        let valString = '200.00';
        if (v.valorCobrado !== undefined && v.valorCobrado !== null) {
            if (typeof v.valorCobrado === 'number') {
                valString = v.valorCobrado.toFixed(2);
            } else {
                const num = parseFloat(String(v.valorCobrado).replace(/[^\d.,]/g, '').replace(',', '.'));
                if (!isNaN(num)) valString = num.toFixed(2);
            }
        }

        setDadosReciboPreenchido({
            cliente: v.cliente,
            endereco: v.endereco,
            horario: v.horarioPrevisto,
            data: dataFormatada,
            valor: valString,
        });

        setSubpaginaAtiva('pdf');
    };

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            {/* Header com os Botões/Tabs Grandes IDÊNTICOS ao da Calculadora */}
            <header className="text-center mb-8 flex flex-col items-center relative">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">
                    Central de Visitas Técnicas
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
                    <button
                        type="button"
                        onClick={() => setSubpaginaAtiva('tabela')}
                        className={`p-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                            subpaginaAtiva === 'tabela'
                                ? 'border-highlight bg-highlight/10 text-highlight'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                        }`}
                    >
                        <span className="text-2xl">📋</span>
                        <span className="text-base font-black">Tabela de Visitas</span>
                        <span className="text-xs opacity-75">Paradas & Reordenação</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubpaginaAtiva('rotas')}
                        className={`p-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                            subpaginaAtiva === 'rotas'
                                ? 'border-highlight bg-highlight/10 text-highlight'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                        }`}
                    >
                        <span className="text-2xl">🗺️</span>
                        <span className="text-base font-black">Rotas do Dia</span>
                        <span className="text-xs opacity-75">Otimização com Trânsito</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubpaginaAtiva('pdf')}
                        className={`p-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                            subpaginaAtiva === 'pdf'
                                ? 'border-highlight bg-highlight/10 text-highlight'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                        }`}
                    >
                        <span className="text-2xl">📝</span>
                        <span className="text-base font-black">Gerar PDF</span>
                        <span className="text-xs opacity-75">Termo Oficial (14 Dias)</span>
                    </button>
                </div>
            </header>

            {/* Conteúdo da Subpágina Ativa */}
            <main>
                {subpaginaAtiva === 'tabela' && (
                    <TabelaVisitasView
                        visitas={visitas}
                        loading={loading}
                        apiUtilizada={apiUtilizada}
                        errorMsg={errorMsg}
                        onDragEnd={handleDragEnd}
                        onCalcularRota={handleCalcularMelhorRota}
                        onAdicionarVisita={handleAdicionarVisita}
                        onAtualizarVisita={handleAtualizarVisita}
                        onRemoverVisita={handleRemoverVisita}
                        onSelecionarParaRecibo={handleSelecionarParaRecibo}
                    />
                )}

                {subpaginaAtiva === 'rotas' && (
                    <RotasItinerario
                        visitas={visitas}
                        loading={loading}
                        apiUtilizada={apiUtilizada}
                        errorMsg={errorMsg}
                        onCalcularRota={handleCalcularMelhorRota}
                        onSelecionarParaRecibo={handleSelecionarParaRecibo}
                    />
                )}

                {subpaginaAtiva === 'pdf' && (
                    <div className="max-w-4xl mx-auto">
                        <FormularioReciboPDF
                            key={dadosReciboPreenchido.cliente || 'novo'}
                            initialClientName={dadosReciboPreenchido.cliente}
                            initialAddress={dadosReciboPreenchido.endereco}
                            initialVisitTime={dadosReciboPreenchido.horario}
                            initialVisitDate={dadosReciboPreenchido.data}
                            initialVisitValue={dadosReciboPreenchido.valor}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
