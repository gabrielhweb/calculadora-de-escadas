import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Visita, ApiUtilizada, TemperaturaLead, StatusVisita } from './types';
import { TabelaVisitasHeader } from './TabelaVisitasHeader';
import { TabelaVisitasRow } from './TabelaVisitasRow';

interface TabelaVisitasViewProps {
    visitas: Visita[];
    loading: boolean;
    apiUtilizada: ApiUtilizada;
    errorMsg: string | null;
    onDragEnd: (event: DragEndEvent) => void;
    onCalcularRota: () => void;
    onAdicionarVisita?: (visita: Visita) => void;
    onAtualizarVisita?: (visita: Visita) => void;
    onRemoverVisita?: (id: string) => void;
    onSelecionarParaRecibo?: (visita: Visita) => void;
}

export const TabelaVisitasView: React.FC<TabelaVisitasViewProps> = ({
    visitas,
    loading,
    apiUtilizada,
    errorMsg,
    onDragEnd,
    onCalcularRota,
    onAdicionarVisita,
    onAtualizarVisita,
    onRemoverVisita,
    onSelecionarParaRecibo,
}) => {
    const [modalAberto, setModalAberto] = useState(false);
    const [visitaEmEdicao, setVisitaEmEdicao] = useState<Visita | null>(null);

    const [novoCliente, setNovoCliente] = useState('');
    const [novoTelefone, setNovoTelefone] = useState('');
    const [novoCep, setNovoCep] = useState('');
    const [novoEndereco, setNovoEndereco] = useState('');
    const [novoHorario, setNovoHorario] = useState('09:00');
    const [novoMotivo, setNovoMotivo] = useState('Medição de vão e viabilidade técnica');
    const [novoValorCobrado, setNovoValorCobrado] = useState('200');
    const [novoQuandoCobrar, setNovoQuandoCobrar] = useState('No dia da visita');
    const [novaTemperatura, setNovaTemperatura] = useState<TemperaturaLead>('QUENTE');
    const [novoStatus, setNovoStatus] = useState<StatusVisita>('PENDENTE');
    const [novaLatitude, setNovaLatitude] = useState('-23.5505');
    const [novaLongitude, setNovaLongitude] = useState('-46.6333');
    const [buscandoCep, setBuscandoCep] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const resetarFormulario = () => {
        setVisitaEmEdicao(null);
        setNovoCliente('');
        setNovoTelefone('');
        setNovoCep('');
        setNovoEndereco('');
        setNovoHorario('09:00');
        setNovoMotivo('Medição de vão e viabilidade técnica');
        setNovoValorCobrado('200');
        setNovoQuandoCobrar('No dia da visita');
        setNovaTemperatura('QUENTE');
        setNovoStatus('PENDENTE');
        setNovaLatitude('-23.5505');
        setNovaLongitude('-46.6333');
    };

    const handleAbrirNovaVisita = () => {
        resetarFormulario();
        setModalAberto(true);
    };

    const handleAbrirEdicao = (v: Visita) => {
        setVisitaEmEdicao(v);
        setNovoCliente(v.cliente);
        setNovoTelefone(v.telefone || '');
        setNovoCep('');
        setNovoEndereco(v.endereco);
        setNovoHorario(v.horarioPrevisto);
        setNovoMotivo(v.motivoVisita || '');
        setNovoValorCobrado(v.valorCobrado !== undefined && v.valorCobrado !== null ? String(v.valorCobrado) : '200');
        setNovoQuandoCobrar(v.quandoCobrar || 'No dia da visita');
        setNovaTemperatura(v.temperatura);
        setNovoStatus(v.status);
        setNovaLatitude(String(v.latitude));
        setNovaLongitude(String(v.longitude));
        setModalAberto(true);
    };

    const handleBuscarCep = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length === 8) {
            setBuscandoCep(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setNovoEndereco(`${data.logradouro}, nº  - ${data.bairro}, ${data.localidade} - ${data.uf}`);
                }
            } catch (err) {
                console.error('Erro ao consultar CEP:', err);
            } finally {
                setBuscandoCep(false);
            }
        }
    };

    const handleSalvarVisita = (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoCliente || !novoEndereco) {
            alert('Por favor, preencha o nome do cliente e o endereço da visita.');
            return;
        }

        let parsedValor: number | string = novoValorCobrado.trim();
        const lower = novoValorCobrado.trim().toLowerCase();
        if (lower === '0' || lower === 'gratis' || lower === 'grátis' || lower === 'gratuito') {
            parsedValor = 0;
        } else {
            const num = parseFloat(novoValorCobrado.replace(/[^\d.,]/g, '').replace(',', '.'));
            if (!isNaN(num)) {
                parsedValor = num;
            }
        }

        if (visitaEmEdicao) {
            const atualizada: Visita = {
                ...visitaEmEdicao,
                cliente: novoCliente,
                telefone: novoTelefone || '(11) 99999-9999',
                endereco: novoEndereco,
                horarioPrevisto: novoHorario || '10:00',
                motivoVisita: novoMotivo || 'Medição técnica',
                temperatura: novaTemperatura,
                status: novoStatus,
                latitude: parseFloat(novaLatitude) || visitaEmEdicao.latitude,
                longitude: parseFloat(novaLongitude) || visitaEmEdicao.longitude,
                valorCobrado: parsedValor,
                quandoCobrar: novoQuandoCobrar || 'No dia da visita',
            };

            if (onAtualizarVisita) {
                onAtualizarVisita(atualizada);
            }
        } else {
            const nova: Visita = {
                id: `visita-${Date.now()}`,
                cliente: novoCliente,
                telefone: novoTelefone || '(11) 99999-9999',
                endereco: novoEndereco,
                horarioPrevisto: novoHorario || '10:00',
                motivoVisita: novoMotivo || 'Medição técnica',
                temperatura: novaTemperatura,
                status: novoStatus,
                latitude: parseFloat(novaLatitude) || -23.5505,
                longitude: parseFloat(novaLongitude) || -46.6333,
                valorVisita: 380,
                valorCobrado: parsedValor,
                quandoCobrar: novoQuandoCobrar || 'No dia da visita',
            };

            if (onAdicionarVisita) {
                onAdicionarVisita(nova);
            }
        }

        setModalAberto(false);
        resetarFormulario();
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <TabelaVisitasHeader
                totalVisitas={visitas.length}
                loading={loading}
                apiUtilizada={apiUtilizada}
                errorMsg={errorMsg}
                onCalcularRota={onCalcularRota}
                onNovaVisita={handleAbrirNovaVisita}
            />

            <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onDragEnd}
                    >
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 dark:bg-gray-700/60 border-b-2 border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="p-3.5 text-center text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider w-12">
                                        MOVER
                                    </th>
                                    <th className="p-3.5 text-center text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider w-16">
                                        ORDEM
                                    </th>
                                    <th className="p-3.5 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider w-24">
                                        HORÁRIO
                                    </th>
                                    <th className="p-3.5 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                        CLIENTE PROSPECT / CONTATO
                                    </th>
                                    <th className="p-3.5 text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                        ENDEREÇO DA VISITA
                                    </th>
                                    <th className="p-3.5 text-center text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider w-32">
                                        VALOR COBRADO
                                    </th>
                                    <th className="p-3.5 text-center text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider w-44">
                                        QUANDO COBRAR
                                    </th>
                                    <th className="p-3.5 text-center text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider w-28">
                                        LEAD
                                    </th>
                                    <th className="p-3.5 text-center text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider w-32">
                                        STATUS
                                    </th>
                                    <th className="p-3.5 text-right text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider w-44">
                                        AÇÕES
                                    </th>
                                </tr>
                            </thead>

                            <SortableContext
                                items={visitas.map((v) => v.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {visitas.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-10 text-center text-gray-400 dark:text-gray-500">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <span className="text-3xl">📍</span>
                                                    <p className="font-bold text-gray-700 dark:text-gray-300">
                                                        Nenhuma visita cadastrada para hoje.
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Clique em "Nova Visita" acima para registrar um lead ou prospect.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        visitas.map((visita, idx) => (
                                            <TabelaVisitasRow
                                                key={visita.id}
                                                visita={visita}
                                                index={idx}
                                                onRemoverVisita={onRemoverVisita}
                                                onSelecionarParaRecibo={onSelecionarParaRecibo}
                                                onEditarVisita={handleAbrirEdicao}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </SortableContext>
                        </table>
                    </DndContext>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 px-1">
                <span>
                    💡 Dica: Clique e arraste o ícone <strong>☰</strong> para reordenar as visitas antes de calcular a rota com trânsito.
                </span>
                <span className="mt-1 sm:mt-0 font-medium">
                    Visitas de pré-venda (orçamentos & medições de obra)
                </span>
            </div>

            {/* Modal de Cadastrar / Editar Visita */}
            {modalAberto && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-300 dark:border-gray-600 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b-2 border-highlight mb-4">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <span>{visitaEmEdicao ? '✏️' : '📍'}</span>{' '}
                                {visitaEmEdicao ? 'Editar Visita Técnica' : 'Cadastrar Visita Técnica (Lead)'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setModalAberto(false);
                                    resetarFormulario();
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSalvarVisita} className="space-y-4">
                            <div>
                                <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">
                                    Nome do Lead / Cliente Prospect *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={novoCliente}
                                    onChange={(e) => setNovoCliente(e.target.value)}
                                    placeholder="Ex: Dra. Camila Siqueira"
                                    className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2.5 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-bold text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">
                                        Telefone / WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        value={novoTelefone}
                                        onChange={(e) => setNovoTelefone(e.target.value)}
                                        placeholder="(11) 99887-6655"
                                        className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2.5 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">
                                        Horário Previsto
                                    </label>
                                    <input
                                        type="text"
                                        value={novoHorario}
                                        onChange={(e) => setNovoHorario(e.target.value)}
                                        placeholder="09:30"
                                        className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2.5 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-bold text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-1">
                                    <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">
                                        CEP
                                    </label>
                                    <input
                                        type="text"
                                        value={novoCep}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setNovoCep(v);
                                            if (v.replace(/\D/g, '').length === 8) {
                                                handleBuscarCep(v);
                                            }
                                        }}
                                        placeholder="01310-100"
                                        className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2.5 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-bold text-sm"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">
                                        Endereço Completo * {buscandoCep && <span className="text-highlight text-xs">(Buscando...)</span>}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={novoEndereco}
                                        onChange={(e) => setNovoEndereco(e.target.value)}
                                        placeholder="Av. Paulista, 1000 - Bela Vista, SP"
                                        className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2.5 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-bold text-sm"
                                    />
                                </div>
                            </div>

                            {/* Seção Nova: Valor Cobrado e Quando Cobrar */}
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">
                                            Valor Cobrado (R$)
                                        </label>
                                        <input
                                            type="text"
                                            value={novoValorCobrado}
                                            onChange={(e) => setNovoValorCobrado(e.target.value)}
                                            placeholder="Ex: 200, 400 ou Grátis"
                                            className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-bold text-sm"
                                        />
                                        <div className="flex gap-1.5 mt-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setNovoValorCobrado('200')}
                                                className="text-[11px] font-bold px-2 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-highlight cursor-pointer"
                                            >
                                                R$ 200
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNovoValorCobrado('400')}
                                                className="text-[11px] font-bold px-2 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-highlight cursor-pointer"
                                            >
                                                R$ 400
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNovoValorCobrado('0')}
                                                className="text-[11px] font-bold px-2 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-highlight cursor-pointer"
                                            >
                                                Grátis
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">
                                            Quando Cobrar
                                        </label>
                                        <input
                                            type="text"
                                            list="lista-quando-cobrar"
                                            value={novoQuandoCobrar}
                                            onChange={(e) => setNovoQuandoCobrar(e.target.value)}
                                            placeholder="Ex: No dia da visita"
                                            className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-bold text-sm"
                                        />
                                        <datalist id="lista-quando-cobrar">
                                            <option value="No dia da visita" />
                                            <option value="Se passar 2 semanas da visita" />
                                            <option value="Na confirmação (Adiantado)" />
                                            <option value="Ao aprovar o orçamento" />
                                            <option value="Isento / Cortesia" />
                                        </datalist>
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setNovoQuandoCobrar('No dia da visita')}
                                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-highlight cursor-pointer"
                                            >
                                                No dia
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNovoQuandoCobrar('Se passar 2 semanas da visita')}
                                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-highlight cursor-pointer"
                                            >
                                                2 semanas
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNovoQuandoCobrar('Na confirmação (Adiantado)')}
                                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-highlight cursor-pointer"
                                            >
                                                Adiantado
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">
                                    Motivo da Visita
                                </label>
                                <input
                                    type="text"
                                    value={novoMotivo}
                                    onChange={(e) => setNovoMotivo(e.target.value)}
                                    placeholder="Ex: Medição técnica de vão, estudo estrutural"
                                    className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2.5 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-bold text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">
                                        Temperatura do Lead
                                    </label>
                                    <select
                                        value={novaTemperatura}
                                        onChange={(e) => setNovaTemperatura(e.target.value as TemperaturaLead)}
                                        className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2.5 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-bold text-sm cursor-pointer"
                                    >
                                        <option value="QUENTE">🔥 QUENTE (Alta intenção)</option>
                                        <option value="MORNO">⚡ MORNO (Comparando)</option>
                                        <option value="FRIO">❄️ FRIO (Fase inicial)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">
                                        Status da Visita
                                    </label>
                                    <select
                                        value={novoStatus}
                                        onChange={(e) => setNovoStatus(e.target.value as StatusVisita)}
                                        className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-2.5 rounded-md border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight font-bold text-sm cursor-pointer"
                                    >
                                        <option value="PENDENTE">⏳ PENDENTE</option>
                                        <option value="EM_ROTA">🚗 EM ROTA</option>
                                        <option value="CONCLUIDO">✅ CONCLUÍDO</option>
                                        <option value="CANCELADO">❌ CANCELADO</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                                        Latitude (Rota)
                                    </label>
                                    <input
                                        type="text"
                                        value={novaLatitude}
                                        onChange={(e) => setNovaLatitude(e.target.value)}
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                                        Longitude (Rota)
                                    </label>
                                    <input
                                        type="text"
                                        value={novaLongitude}
                                        onChange={(e) => setNovaLongitude(e.target.value)}
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalAberto(false);
                                        resetarFormulario();
                                    }}
                                    className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 text-sm font-black bg-highlight hover:bg-amber-600 text-gray-950 rounded-lg shadow-md transition-colors cursor-pointer"
                                >
                                    {visitaEmEdicao ? 'Atualizar Visita' : 'Salvar Visita'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TabelaVisitasView;
