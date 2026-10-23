import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export const insertMissingContracts = async () => {
    try {
        console.log("Inserindo contratos que faltavam...");
        
        // 1. Everton de Araujo
        
        // 3. Maria Helena Jara Guastamacchia
        const mariaContract = {
            createdAt: "2026-10-21T11:44:04.000Z",
            clientName: "Maria Helena Jara Guastamacchia",
            totalValue: 7251.35,
            status: "producao",
            contractData: {
                userData: {
                    name: "Maria Helena Jara Guastamacchia",
                    cpf: "250.587.428-02",
                    address: "Rua das Gilias, 389 - Vila Bela, São Paulo - SP, 03201-070"
                },
                inputData: {
                    desiredSteps: 13,
                    totalHeight: 274,
                    totalLength: 267,
                    stairWidth: 70,
                    treadDepth: 20,
                    treadMaterial: "metal",
                    dampers: 4,
                    stairDirection: "standard",
                    wallFixation: "left",
                    optionalItems: []
                },
                totalPrice: 7633,
                freightCost: 340,
                installationCost: 390,
                isInstallationIncluded: true,
                discount: 5,
                discountValue: 381.65,
                finalPrice: 7251.35,
                paymentMethod: "pix",
                pixTiming: "entry",
                installments: 1
            }
        };

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
        await addDoc(collection(db, 'contracts'), mariaContract);
        
        console.log("Contratos do Everton e José inseridos com sucesso!");
    } catch (e) {
        console.error("Erro ao inserir contratos:", e);
    }
};
