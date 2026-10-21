import React, { useState } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Visita, ApiUtilizada } from '../components/visitas/types';
import { FormularioReciboPDF } from '../components/visitas/FormularioReciboPDF';
import { TabelaVisitasView } from '../components/visitas/TabelaVisitasView';
import { RotasItinerario } from '../components/visitas/RotasItinerario';

type SubpaginaVisitas = 'pdf' | 'tabela' | 'rotas';

const VISITAS_PADRAO: Visita[] = [
    {
        id: 'visita-1',
        cliente: 'Fábio Chalita',
        telefone: '(35) 99881-2233',
        endereco: 'Rua Ypês, 92 - Salto de Baixo, Extrema - MG',
        horarioPrevisto: '08:30',
        temperatura: 'QUENTE',
        status: 'PENDENTE',
        latitude: -22.8542,
        longitude: -46.3183,
    },
    {
        id: 'visita-2',
        cliente: 'Alexandre Bergamo',
        telefone: '(15) 98112-4455',
        endereco: 'Jardim Residencial Chácara Ondina, Sorocaba - SP',
        horarioPrevisto: '11:00',
        temperatura: 'QUENTE',
        status: 'PENDENTE',
        latitude: -23.5015,
        longitude: -47.4526,
    },
    {
        id: 'visita-3',
        cliente: 'Mário dos Reis Filho',
        telefone: '(11) 97223-9900',
        endereco: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
        horarioPrevisto: '14:30',
        temperatura: 'MORNO',
        status: 'PENDENTE',
        latitude: -23.5615,
        longitude: -46.6560,
    },
    {
        id: 'visita-4',
        cliente: 'Diego Ferreira Santos',
        telefone: '(11) 96554-1122',
        endereco: 'Rua das Flores, 450 - Santana, São Paulo - SP',
        horarioPrevisto: '16:45',
        temperatura: 'FRIO',
        status: 'PENDENTE',
        latitude: -23.5005,
        longitude: -46.6289,
    },
];

export default function VisitReceipt() {
    const [subpaginaAtiva, setSubpaginaAtiva] = useState<SubpaginaVisitas>('tabela');
    const [visitas, setVisitas] = useState<Visita[]>(VISITAS_PADRAO);
    const [loading, setLoading] = useState<boolean>(false);
    const [apiUtilizada, setApiUtilizada] = useState<ApiUtilizada>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Dados selecionados para preenchimento automático do formulário do recibo PDF
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

    const handleCalcularMelhorRota = async () => {
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

        // Alterna automaticamente para a aba "Criar PDF"
        setSubpaginaAtiva('pdf');
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 font-sans selection:bg-zinc-100 selection:text-zinc-950">
            {/* Navegação por Subpáginas / Abas Brutalistas */}
            <div className="mb-8 border-b-2 border-zinc-800 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="bg-zinc-100 text-zinc-950 font-black text-xs uppercase px-2 py-0.5 tracking-wider">
                                MÓDULO VISITAS TÉCNICAS
                            </span>
                            <span className="text-zinc-400 font-mono text-xs">
                                3 SUBPÁGINAS ATIVAS
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 text-zinc-100">
                            Gestão de Visitas e Recibos
                        </h1>
                    </div>

                    {/* Botões das 3 Subpáginas */}
                    <div className="flex border border-zinc-700 bg-zinc-900 p-1 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setSubpaginaAtiva('pdf')}
                            className={`flex-1 sm:flex-none font-black text-xs uppercase px-4 py-2.5 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                                subpaginaAtiva === 'pdf'
                                    ? 'bg-zinc-100 text-zinc-950'
                                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                            }`}
                        >
                            <span>📝</span>
                            <span>Criar PDF</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSubpaginaAtiva('tabela')}
                            className={`flex-1 sm:flex-none font-black text-xs uppercase px-4 py-2.5 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                                subpaginaAtiva === 'tabela'
                                    ? 'bg-zinc-100 text-zinc-950'
                                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                            }`}
                        >
                            <span>📋</span>
                            <span>Tabela</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSubpaginaAtiva('rotas')}
                            className={`flex-1 sm:flex-none font-black text-xs uppercase px-4 py-2.5 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                                subpaginaAtiva === 'rotas'
                                    ? 'bg-zinc-100 text-zinc-950'
                                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                            }`}
                        >
                            <span>🗺️</span>
                            <span>Rotas</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Conteúdo Renderizado da Subpágina Ativa */}
            <div>
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

                {subpaginaAtiva === 'tabela' && (
                    <TabelaVisitasView
                        visitas={visitas}
                        loading={loading}
                        apiUtilizada={apiUtilizada}
                        errorMsg={errorMsg}
                        onDragEnd={handleDragEnd}
                        onCalcularRota={handleCalcularMelhorRota}
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
            </div>
        </div>
    );
}
