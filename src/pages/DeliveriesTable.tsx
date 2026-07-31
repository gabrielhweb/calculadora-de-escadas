import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { SavedContract } from '../types';

export const DeliveriesTable: React.FC = () => {
    const [contracts, setContracts] = useState<SavedContract[]>([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setContracts([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'contracts'), where('status', '==', 'producao'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedContracts: SavedContract[] = [];
            snapshot.forEach((doc) => {
                loadedContracts.push({ id: doc.id, ...doc.data() } as SavedContract);
            });
            // Sort by createdAt ascending (oldest first for deliveries)
            loadedContracts.sort((a, b) => {
                const getTime = (date: any) => {
                    if (!date) return 0;
                    if (typeof date.toDate === 'function') return date.toDate().getTime();
                    return new Date(date).getTime() || 0;
                };
                return getTime(a.createdAt) - getTime(b.createdAt);
            });
            setContracts(loadedContracts);
            setLoading(false);
        }, (error) => {
            console.error('Firestore Error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handlePrint = () => {
        window.print();
    };

    const parseContractData = (dataStr: any) => {
        try {
            let parsed = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
            while (typeof parsed === 'string') {
                parsed = JSON.parse(parsed);
            }
            return parsed;
        } catch (e) {
            return null;
        }
    };

    const getFullAddress = (userData: any) => {
        if (!userData) return '';
        if (userData.address && !userData.street) return userData.address; // Fallback
        const parts = [
            userData.street,
            userData.number,
            userData.neighborhood,
            userData.city,
            userData.state ? `- ${userData.state}` : '',
            userData.zip ? `CEP: ${userData.zip}` : ''
        ].filter(Boolean);
        return parts.join(', ');
    };

    const getMeasurements = (parsedData: any) => {
        if (!parsedData || !parsedData.inputData) return '';
        const { inputData, selectedOption } = parsedData;
        const steps = selectedOption?.steps || inputData.desiredSteps;
        const tread = selectedOption?.treadDepth || inputData.treadDepth;
        const height = selectedOption?.stepHeight || (inputData.totalHeight / inputData.desiredSteps).toFixed(2);
        const width = selectedOption?.stairWidth || inputData.stairWidth;
        
        let med = `${steps} DEGRAUS\n`;
        med += `PISADA: ${tread}cm\n`;
        med += `ALT: ${height}cm\n`;
        med += `LARGURA: ${width}cm\n`;

        if (selectedOption?.landings && selectedOption.landings.length > 0) {
            selectedOption.landings.forEach((l: any, idx: number) => {
                const type = l.type === 'articulated' ? 'ARTICULADO' : 'FIXO';
                med += `Patamar ${idx + 1} (${type}): ${l.length}cm x ${l.width}cm\n`;
            });
        }
        return med;
    };

    const getAttention = (parsedData: any) => {
        if (!parsedData || !parsedData.inputData) return '';
        const { inputData, selectedOption } = parsedData;
        let att = [];
        
        if (inputData.treadMaterial === 'chapa_xadrez') att.push('CHAPA XADREZ');
        if (inputData.treadMaterial === 'metal') att.push('METALON (PARA FORA?)');
        if (inputData.treadMaterial === 'wood') att.push('MADEIRA');
        if (inputData.hasCorrimao) att.push('COM CORRIMÃO');
        
        if (selectedOption?.landings && selectedOption.landings.length > 0) {
            const hasArticulated = selectedOption.landings.some((l:any) => l.type === 'articulated');
            if (hasArticulated) att.push('PATAMAR RETRÁTIL');
            
            selectedOption.landings.forEach((l: any) => {
                if (l.frenchBrackets > 0) {
                    att.push(`(${l.frenchBrackets} mão francesa)`);
                }
            });
        }
        return att.join(' - ');
    };

    const getHinges = (parsedData: any) => {
        if (!parsedData || !parsedData.selectedOption) return '';
        const landings = parsedData.selectedOption.landings || [];
        const articulatedCount = landings.filter((l:any) => l.type === 'articulated').length;
        if (articulatedCount > 0) {
            return `Sugerido: ${articulatedCount * 2}`;
        }
        return '';
    };

    const formatDate = (dateString: any) => {
        if (!dateString) return '';
        try {
            let d;
            if (typeof dateString.toDate === 'function') d = dateString.toDate();
            else d = new Date(dateString);
            return d.toLocaleDateString('pt-BR');
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 print:p-0">
            <style>
                {`
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    .print-hidden { display: none !important; }
                    .print-table { width: 100% !important; border-collapse: collapse; font-size: 11px !important; }
                    .print-table th, .print-table td { border: 1px solid #000 !important; padding: 4px !important; color: #000 !important; }
                    .print-table th { background-color: #f3f4f6 !important; font-weight: bold !important; text-align: left; }
                    
                    /* Oculta layout principal para imprimir só a tabela */
                    nav, header, footer { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    
                    .editable-cell { border: none !important; outline: none !important; min-height: 20px; white-space: pre-wrap; word-break: break-word; }
                }
                .editable-cell {
                    min-height: 40px;
                    padding: 8px;
                    border: 1px dashed transparent;
                    transition: border-color 0.2s;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                .editable-cell:hover, .editable-cell:focus {
                    border-color: #3b82f6;
                    outline: none;
                    background-color: rgba(59, 130, 246, 0.05);
                }
                `}
            </style>

            <div className="flex justify-between items-center mb-6 print-hidden">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Tabela de Entregas</h1>
                    <p className="text-gray-500 dark:text-gray-400">Edite os campos pontilhados antes de imprimir.</p>
                </div>
                <button 
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 transition-colors"
                >
                    🖨️ Imprimir Tabela
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 print-hidden">Carregando contratos...</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto print:border-none print:shadow-none print:bg-white print:overflow-visible">
                    <table className="w-full text-left print-table">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[12%]">CLIENTE</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[20%]">LOCALIZAÇÃO</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[10%]">DATA ENTREGA</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[10%]">DATA CONTRATO</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[8%]">QTD DOBRADIÇAS</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[20%]">ATENÇÃO</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[20%]">MEDIDAS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400 print-hidden">
                                        Nenhuma entrega em produção no momento.
                                    </td>
                                </tr>
                            ) : (
                                contracts.map(contract => {
                                    const data = parseContractData(contract.contractData);
                                    const address = getFullAddress(data?.userData);
                                    const attention = getAttention(data);
                                    const measurements = getMeasurements(data);
                                    const hinges = getHinges(data);
                                    const dateContract = formatDate(contract.createdAt);
                                    
                                    return (
                                        <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors print:hover:bg-white text-gray-800 dark:text-gray-300">
                                            <td className="p-2 align-top">
                                                <div className="editable-cell font-bold" contentEditable suppressContentEditableWarning>
                                                    {contract.clientName}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-sm">
                                                <div className="editable-cell" contentEditable suppressContentEditableWarning>
                                                    {address}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-sm font-semibold">
                                                <div className="editable-cell" contentEditable suppressContentEditableWarning>
                                                    {/* Espaço para data de entrega */}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-sm">
                                                <div className="editable-cell" contentEditable suppressContentEditableWarning>
                                                    {dateContract}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-sm font-bold text-center">
                                                <div className="editable-cell" contentEditable suppressContentEditableWarning>
                                                    {hinges}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-sm text-red-600 dark:text-red-400 print:text-black font-semibold">
                                                <div className="editable-cell" contentEditable suppressContentEditableWarning>
                                                    {attention}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-xs font-mono">
                                                <div className="editable-cell" contentEditable suppressContentEditableWarning>
                                                    {measurements}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
