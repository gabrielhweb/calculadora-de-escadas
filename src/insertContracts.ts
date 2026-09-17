import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export const insertMissingContracts = async () => {
    try {
        console.log("Inserindo contratos que faltavam...");
        
        // 1. Everton de Araujo
        const evertonContract = {
            createdAt: new Date().toISOString(),
            clientName: "Everton de Araujo",
            totalValue: 7172.50,
            status: "producao", // default status
            contractData: {
                userData: {
                    name: "Everton de Araujo",
                    cpf: "313.386.728-86",
                    address: "Rua Vasco da Gama, 63 - Cipava, Osasco - SP, 06065-420"
                },
                inputData: {
                    desiredSteps: 14,
                    totalHeight: 312,
                    totalLength: 287,
                    stairWidth: 70,
                    treadDepth: 20,
                    treadMaterial: "metal",
                    dampers: 4,
                    stairDirection: "standard",
                    optionalItems: []
                },
                totalPrice: 7550,
                freightCost: 340,
                installationCost: 350,
                isInstallationIncluded: true,
                discount: 5,
                discountValue: 377.50,
                finalPrice: 7172.50,
                paymentMethod: "hybrid",
                pixTiming: "entry",
                installments: 1
            }
        };

        // 2. José Guilherme Severini
        const joseContract = {
            createdAt: new Date().toISOString(),
            clientName: "José Guilherme Severini",
            totalValue: 6400,
            status: "producao",
            contractData: {
                userData: {
                    name: "José Guilherme Severini",
                    cpf: "443.023.396-91",
                    address: "Rua Tangará, 20 - Condomínio Campo da Cachoeira, Poços de Caldas - MG, 37704-900"
                },
                inputData: {
                    desiredSteps: 13,
                    totalHeight: 365,
                    totalLength: 267,
                    stairWidth: 60,
                    treadDepth: 20,
                    treadMaterial: "metal",
                    dampers: 4,
                    stairDirection: "standard",
                    optionalItems: []
                },
                totalPrice: 6870,
                freightCost: 450,
                installationCost: 310,
                isInstallationIncluded: true,
                discount: 6.84133,
                discountValue: 470,
                finalPrice: 6400,
                paymentMethod: "hybrid",
                pixTiming: "entry",
                installments: 1
            }
        };

        await addDoc(collection(db, 'contracts'), evertonContract);
        await addDoc(collection(db, 'contracts'), joseContract);
        
        console.log("Contratos do Everton e José inseridos com sucesso!");
    } catch (e) {
        console.error("Erro ao inserir contratos:", e);
    }
};
