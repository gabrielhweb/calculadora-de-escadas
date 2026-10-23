import React, { useState, useEffect } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Visita, ApiUtilizada } from '../components/visitas/types';
import { FormularioReciboPDF } from '../components/visitas/FormularioReciboPDF';
import { TabelaVisitasView } from '../components/visitas/TabelaVisitasView';
import { RotasItinerario } from '../components/visitas/RotasItinerario';

type SubpaginaVisitas = 'tabela' | 'rotas' | 'pdf';

const STORAGE_KEY = 'zilinski_visitas_leads_v2';

// Lista inicial de leads e orçamentos de pré-venda (totalmente desvinculada de contratos de fabricação)
const VISITAS_PROSPECT_PADRAO: Visita[] = [
    {
        id: 'lead-1',
        cliente: 'Dr. Roberto Antunes (Alphaville Residencial 2)',
        telefone: '(11) 98765-4321',
        endereco: 'Alameda das Acácias, 310 - Alphaville, Barueri - SP',
        horarioPrevisto: '09:00',
        motivoVisita: 'Medição de vão e escada helicoidal metálica',
        temperatura: 'QUENTE',
        status: 'PENDENTE',
        latitude: -23.4984,
        longitude: -46.8529,
        valorVisita: 200,
        valorCobrado: 200,
        quandoCobrar: 'No dia da visita',
    },
    {
        id: 'lead-2',
        cliente: 'Mariana Silveira (Jardins)',
        telefone: '(11) 99123-8877',
        endereco: 'Rua Bela Cintra, 2100 - Cerqueira César, São Paulo - SP',
        horarioPrevisto: '11:30',
        motivoVisita: 'Avaliação estrutural para escada viga central',
        temperatura: 'QUENTE',
        status: 'PENDENTE',
        latitude: -23.5604,
        longitude: -46.6669,
        valorVisita: 400,
        valorCobrado: 400,
        quandoCobrar: 'Se passar 2 semanas da visita',
    },
    {
        id: 'lead-3',
        cliente: 'Eng. Carlos Eduardo (Vila Mariana)',
        telefone: '(11) 97442-1133',
        endereco: 'Rua Domingos de Morais, 1850 - Vila Mariana, São Paulo - SP',
        horarioPrevisto: '14:30',
        motivoVisita: 'Estudo de viabilidade de escada cascata',
        temperatura: 'MORNO',
        status: 'PENDENTE',
        latitude: -23.5898,
        longitude: -46.6385,
        valorVisita: 200,
        valorCobrado: 200,
        quandoCobrar: 'No dia da visita',
    },
    {
        id: 'lead-4',
        cliente: 'Renata Guimarães (Moema Pássaros)',
        telefone: '(11) 96331-5522',
        endereco: 'Av. Rouxinol, 620 - Moema, São Paulo - SP',
        horarioPrevisto: '16:45',
        motivoVisita: 'Conferência de projeto arquitetônico no local',
        temperatura: 'FRIO',
        status: 'PENDENTE',
        latitude: -23.6053,
        longitude: -46.6667,
        valorVisita: 0,
        valorCobrado: 0,
        quandoCobrar: 'Isento / Cortesia',
    },
];

export default function VisitReceipt() {
    const [subpaginaAtiva, setSubpaginaAtiva] = useState<SubpaginaVisitas>('tabela');
    const [visitas, setVisitas] = useState<Visita[]>(() => {
        try {
            const salvo = localStorage.getItem(STORAGE_KEY);
            if (salvo) {
                const parsed = JSON.parse(salvo);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const contemContrato = parsed.some((p: any) =>
                        p.cliente?.includes('Chalita') || p.cliente?.includes('Bergamo')
                    );
                    if (!contemContrato) {
                        return parsed.map((item: any) => ({
                            ...item,
                            valorCobrado: item.valorCobrado !== undefined ? item.valorCobrado : 200,
                            quandoCobrar: item.quandoCobrar || 'No dia da visita',
                        }));
                    }
                }
            }
        } catch (e) {
            console.error('Erro ao ler visitas do localStorage:', e);
        }
        return VISITAS_PROSPECT_PADRAO;
    });

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

    // Salvar sempre que a lista de visitas for modificada
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(visitas));
        } catch (e) {
            console.error('Erro ao salvar visitas no localStorage:', e);
        }
    }, [visitas]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setVisitas((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleAdicionarVisita = (nova: Visita) => {
        setVisitas((prev) => [...prev, nova]);
    };

    const handleAtualizarVisita = (atualizada: Visita) => {
        setVisitas((prev) => prev.map((v) => (v.id === atualizada.id ? atualizada : v)));
    };

    const handleRemoverVisita = (id: string) => {
        if (window.confirm('Tem certeza que deseja remover esta visita da lista?')) {
            setVisitas((prev) => prev.filter((v) => v.id !== id));
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
                setVisitas(visitasReordenadas);
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
