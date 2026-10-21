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
        valorVisita: 380,
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
        valorVisita: 380,
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
        valorVisita: 380,
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
        valorVisita: 380,
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
                    // Garantir que não carregue nomes de contratos antigos salvos no storage
                    const contemContrato = parsed.some((p: any) =>
                        p.cliente?.includes('Chalita') || p.cliente?.includes('Bergamo')
                    );
                    if (!contemContrato) {
                        return parsed;
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
    }>({
        cliente: '',
        endereco: '',
        horario: '',
        data: '',
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

        setDadosReciboPreenchido({
            cliente: v.cliente,
            endereco: v.endereco,
            horario: v.horarioPrevisto,
            data: dataFormatada,
        });

        setSubpaginaAtiva('pdf');
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
            {/* Cabeçalho Padronizado da Página */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        Gestão de Visitas Técnicas (Pré-Venda)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gerencie visitas de medição e orçamento, otimize rotas com trânsito e emita termos de visita técnica antes do fechamento do contrato.
                    </p>
                </div>

                {/* Seletor de Subpáginas Padronizado */}
                <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 inline-flex gap-1 shadow-sm self-start md:self-auto">
                    <button
                        type="button"
                        onClick={() => setSubpaginaAtiva('tabela')}
                        className={`font-semibold text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                            subpaginaAtiva === 'tabela'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <span>📋</span>
                        <span>Tabela de Visitas</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubpaginaAtiva('rotas')}
                        className={`font-semibold text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                            subpaginaAtiva === 'rotas'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <span>🗺️</span>
                        <span>Rotas do Dia</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSubpaginaAtiva('pdf')}
                        className={`font-semibold text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                            subpaginaAtiva === 'pdf'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <span>📝</span>
                        <span>Criar PDF</span>
                    </button>
                </div>
            </div>

            {/* Conteúdo da Subpágina Ativa */}
            <div>
                {subpaginaAtiva === 'tabela' && (
                    <TabelaVisitasView
                        visitas={visitas}
                        loading={loading}
                        apiUtilizada={apiUtilizada}
                        errorMsg={errorMsg}
                        onDragEnd={handleDragEnd}
                        onCalcularRota={handleCalcularMelhorRota}
                        onAdicionarVisita={handleAdicionarVisita}
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
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
