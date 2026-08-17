import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { SavedContract } from '../types';
import { startOfWeek, endOfWeek, isBefore, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { format as formatTZ } from 'date-fns-tz';

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
            snapshot.forEach((d) => {
                loadedContracts.push({ id: d.id, ...d.data() } as SavedContract);
            });
            // Ordenar pela data de entrega, depois pela data de criação (mais antigos primeiro)
            loadedContracts.sort((a, b) => {
                if (a.deliveryDate && !b.deliveryDate) return -1; // Com data vai pro topo
                if (!a.deliveryDate && b.deliveryDate) return 1;  // Sem data vai pro final
                if (a.deliveryDate && b.deliveryDate) {
                    return a.deliveryDate.localeCompare(b.deliveryDate); // Mais próximos primeiro
                }
                const getTime = (date: any) => {
                    if (!date) return 0;
                    if (typeof date.toDate === 'function') return date.toDate().getTime();
                    return new Date(date).getTime() || 0;
                };
                return getTime(a.createdAt) - getTime(b.createdAt); // Mais antigos primeiro
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
        if (userData.address && !userData.street) return userData.address;
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
        
        let fixationText = "";
        if (inputData.stairGeometry === 'hide') {
            fixationText = "SEM FIXAÇÃO";
        } else if (inputData.stairGeometry && inputData.stairGeometry.includes('Fixação')) {
            fixationText = inputData.stairGeometry;
        } else if (inputData.wallFixation === 'frontal') {
            fixationText = "Fixação FRONTAL";
        } else if (inputData.wallFixation === 'left') {
            fixationText = "Fixação na Parede ESQUERDA";
        } else if (inputData.wallFixation === 'right') {
            fixationText = "Fixação na Parede DIREITA";
        }
        
        let med = fixationText ? `${fixationText}\n` : '';
        med += `${steps} DEGRAUS\n`;
        med += `PISADA: ${tread}cm\n`;
        med += `ALT: ${height}cm\n`;
        med += `LARGURA: ${width}cm\n`;

        if (inputData.treadMaterial === 'wood') {
            let wood = 'MADEIRA';
            if (inputData.woodType === 'garapeira') wood += ' (GARAPEIRA)';
            if (inputData.woodType === 'muiracatiara') wood += ' (MUIRACATIARA)';
            if (inputData.woodType === 'ambas') wood += ' (GARAPEIRA/MUIRACATIARA)';
            med += `MATERIAL: ${wood}\n`;
        } else if (inputData.treadMaterial === 'chapa_xadrez') {
            med += `MATERIAL: CHAPA XADREZ\n`;
        } else if (inputData.treadMaterial === 'chapa_vazada') {
            med += `MATERIAL: CHAPA VAZADA\n`;
        } else if (inputData.treadMaterial === 'metal') {
            med += `MATERIAL: AÇO CARBONO\n`;
        }

        if (selectedOption?.landings && selectedOption.landings.length > 0) {
            selectedOption.landings.forEach((l: any, idx: number) => {
                const type = l.type === 'articulated' ? 'ARTICULADO' : 'FIXO';
                med += `PATAMAR ${idx + 1} (${type}): ${l.length}cm x ${l.width}cm\n`;
            });
        }
        
        if (inputData.optionalItems && inputData.optionalItems.length > 0) {
            inputData.optionalItems.forEach((opt: any) => {
                med += `EXTRA: ${opt.name}\n`;
            });
        }
        
        return med;
    };

    const getDefaultAttention = (parsedData: any) => {
        if (!parsedData || !parsedData.inputData) return '';
        const { inputData, selectedOption } = parsedData;
        let att = [];
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

    const getDefaultHinges = (parsedData: any) => {
        if (!parsedData || !parsedData.inputData) return '';
        const { inputData, selectedOption } = parsedData;
        const numSteps = selectedOption?.steps || inputData.desiredSteps;
        const treadDepthCm = selectedOption?.treadDepth || inputData.treadDepth;
        
        if (!numSteps || !treadDepthCm) return '';
        const hingesPerStep = treadDepthCm <= 16 ? 2 : 4;
        const hingeSize = treadDepthCm > 16 ? '3x2.5/8' : '4x3';
        return `${hingesPerStep * numSteps} dobradiças (${hingeSize})`;
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

    const formatDeliveryDate = (dateString?: string) => {
        if (!dateString) return <span className="print-hidden text-gray-500 italic font-normal">Selecionar Data</span>;
        try {
            const date = parseISO(dateString);
            const formatted = formatTZ(date, "dd/MM/yyyy (EEEE)", { locale: ptBR, timeZone: 'UTC' });
            return <span>{formatted}</span>;
        } catch (e) {
            return <span>{dateString}</span>;
        }
    };

    const getDateColorClass = (dateString?: string) => {
        if (!dateString) return 'bg-gray-100 text-gray-500 hover:bg-gray-200';
        try {
            const date = parseISO(dateString);
            const today = startOfDay(new Date());
            const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Domingo
            const weekEnd = endOfWeek(today, { weekStartsOn: 0 }); // Sábado

            if (isBefore(date, today)) {
                return 'bg-red-100 text-red-800 border-red-300 font-bold'; // Atrasado
            } else if (isWithinInterval(date, { start: weekStart, end: weekEnd })) {
                return 'bg-orange-100 text-orange-800 border-orange-300 font-bold'; // Semana atual
            } else {
                return 'bg-green-50 text-green-700 border-green-200'; // Normal / Futuro
            }
        } catch (e) {
            return 'bg-gray-100 text-gray-700';
        }
    };

    const handleUpdateContract = async (id: string, field: string, value: any) => {
        try {
            const docRef = doc(db, 'contracts', id);
            await updateDoc(docRef, { [field]: value });
        } catch (error) {
            console.error("Erro ao atualizar:", error);
        }
    };

    const handleMarkAsDelivered = async (id: string) => {
        if (window.confirm('Tem certeza que deseja marcar como ENTREGUE? O contrato sairá desta lista.')) {
            try {
                const docRef = doc(db, 'contracts', id);
                await updateDoc(docRef, { status: 'entregue' });
            } catch (error) {
                console.error("Erro ao marcar como entregue:", error);
            }
        }
    };

    const handleAddManualContract = async () => {
        try {
            await addDoc(collection(db, 'contracts'), {
                clientName: 'NOVO CLIENTE (Editar)',
                status: 'producao',
                createdAt: serverTimestamp(),
                contractData: '{}', 
                deliveryNotes: 'Atenção:',
                hingesQty: '-',
                measurementsNotes: '-'
            });
        } catch (error) {
            console.error("Erro ao criar contrato manual", error);
            alert("Erro ao criar cliente manual. Tente novamente.");
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
                    .print-table { width: 100% !important; border-collapse: collapse; font-size: 11px !important; color: black; }
                    .print-table th, .print-table td { border: 1px solid #000 !important; padding: 4px !important; }
                    .print-table th { background-color: #f3f4f6 !important; font-weight: bold !important; text-align: left; }
                    
                    nav, header, footer { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    
                    .editable-cell { border: none !important; outline: none !important; min-height: 20px; white-space: pre-wrap; word-break: break-word; }
                    .date-picker-wrapper input[type="date"] { display: none !important; }
                    .date-display { background: transparent !important; color: black !important; border: none !important; padding: 0 !important; font-weight: bold; }
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
                .date-picker-wrapper {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                }
                .date-picker-wrapper input[type="date"] {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    opacity: 0;
                    cursor: pointer;
                }
                `}
            </style>

            <div className="flex justify-between items-center mb-6 print-hidden">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Tabela de Entregas</h1>
                    <p className="text-gray-500 dark:text-gray-400">Clique nas observações ou nas datas para alterar. O sistema salvará automaticamente.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleAddManualContract}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 transition-colors"
                    >
                        ➕ Novo Cliente
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 transition-colors"
                    >
                        🖨️ Imprimir
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 print-hidden">Carregando contratos...</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto print:border-none print:shadow-none print:bg-white print:overflow-visible">
                    <table className="w-full text-left print-table">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[15%]">CLIENTE</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[20%]">LOCALIZAÇÃO</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[12%]">DATA ENTREGA</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[8%]">QTD DOBRADIÇAS</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[18%]">ATENÇÃO</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[20%]">MEDIDAS</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[7%] print-hidden">AÇÃO</th>
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
                                    const address = contract.customAddress !== undefined ? contract.customAddress : getFullAddress(data?.userData);
                                    
                                    const attention = contract.deliveryNotes !== undefined ? contract.deliveryNotes : getDefaultAttention(data);
                                    const hinges = contract.hingesQty !== undefined ? contract.hingesQty : getDefaultHinges(data);
                                    const measurements = contract.measurementsNotes !== undefined ? contract.measurementsNotes : getMeasurements(data);
                                    
                                    const dateColor = getDateColorClass(contract.deliveryDate);
                                    
                                    return (
                                        <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors print:hover:bg-white text-gray-800 dark:text-gray-300">
                                            <td className="p-2 align-top">
                                                <div 
                                                    className="font-bold px-2 py-1 text-base print:text-[16px] print:font-black editable-cell"
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        if (e.target.innerText !== contract.clientName) {
                                                            handleUpdateContract(contract.id, 'clientName', e.target.innerText);
                                                        }
                                                    }}
                                                >
                                                    {contract.clientName}
                                                </div>
                                                <div className="text-sm font-semibold text-gray-500 print:text-[14px] print:font-bold px-2">
                                                    Contrato: {formatDate(contract.createdAt)}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-sm">
                                                <div 
                                                    className="editable-cell"
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        if (e.target.innerText !== address) {
                                                            handleUpdateContract(contract.id, 'customAddress', e.target.innerText);
                                                        }
                                                    }}
                                                >
                                                    {address}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-sm font-semibold">
                                                <div className="flex flex-col gap-1">
                                                    <div className={`date-display px-2 py-1 rounded transition-colors text-center ${dateColor}`}>
                                                        {formatDeliveryDate(contract.deliveryDate)}
                                                    </div>
                                                    <div className="flex items-center gap-1 print-hidden w-full">
                                                        <input 
                                                            type="date" 
                                                            className="border border-gray-300 rounded px-1 py-1 text-xs text-gray-700 bg-white flex-1 cursor-pointer"
                                                            value={contract.deliveryDate || ''}
                                                            onChange={(e) => handleUpdateContract(contract.id, 'deliveryDate', e.target.value)}
                                                        />
                                                        {contract.deliveryDate && (
                                                            <button 
                                                                onClick={() => handleUpdateContract(contract.id, 'deliveryDate', '')}
                                                                className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors flex-shrink-0"
                                                                title="Remover data"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-sm font-bold text-center">
                                                <div 
                                                    className="editable-cell" 
                                                    contentEditable 
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        if (e.target.innerText !== hinges) {
                                                            handleUpdateContract(contract.id, 'hingesQty', e.target.innerText);
                                                        }
                                                    }}
                                                >
                                                    {hinges}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-sm text-red-600 dark:text-red-400 print:text-red-600 font-semibold print:!text-red-600 print:font-bold">
                                                <div 
                                                    className="editable-cell" 
                                                    contentEditable 
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        if (e.target.innerText !== attention) {
                                                            handleUpdateContract(contract.id, 'deliveryNotes', e.target.innerText);
                                                        }
                                                    }}
                                                >
                                                    {attention}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-xs font-mono">
                                                <div 
                                                    className="editable-cell px-2 py-1 whitespace-pre-wrap"
                                                    contentEditable 
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        if (e.target.innerText !== measurements) {
                                                            handleUpdateContract(contract.id, 'measurementsNotes', e.target.innerText);
                                                        }
                                                    }}
                                                >
                                                    {measurements}
                                                </div>
                                            </td>
                                            <td className="p-2 align-middle print-hidden flex flex-col gap-2">
                                                <button 
                                                    onClick={() => handleMarkAsDelivered(contract.id)}
                                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-2 rounded text-xs transition-colors shadow-sm"
                                                    title="Marcar como entregue"
                                                >
                                                    Entregue ✓
                                                </button>
                                                <label className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-2 rounded text-xs transition-colors shadow-sm cursor-pointer text-center block" title="Anexar Imagem">
                                                    Anexar Imagem
                                                    <input type="file" className="hidden" accept="image/*,video/*" onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            try {
                                                                const { uploadImageToFirebase } = await import('../services/firebaseStorage');
                                                                const url = await uploadImageToFirebase(file, 'projects', contract.id);
                                                                const currentImages = contract.projectImages || [];
                                                                handleUpdateContract(contract.id, 'projectImages', [...currentImages, url]);
                                                                alert('Imagem anexada com sucesso!');
                                                            } catch (err) {
                                                                alert('Erro ao anexar imagem.');
                                                            }
                                                        }
                                                    }} />
                                                </label>
                                                {contract.projectImages && contract.projectImages.length > 0 && (
                                                    <div className="flex gap-1 flex-wrap mt-1">
                                                        {contract.projectImages.map((img: string, idx: number) => (
                                                            <a key={idx} href={img} target="_blank" rel="noreferrer" className="w-8 h-8 rounded border border-gray-300 overflow-hidden inline-block">
                                                                <img src={img} alt="Anexo" className="w-full h-full object-cover" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
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
