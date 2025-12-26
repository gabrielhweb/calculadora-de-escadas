
import { SavedQuote } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'zilinski_quotes';

// --- FUNÇÕES AUXILIARES LOCAIS ---
const getLocalQuotes = (): SavedQuote[] => {
    const existingData = localStorage.getItem(STORAGE_KEY);
    return existingData ? JSON.parse(existingData) : [];
};

const saveLocalQuote = (quote: SavedQuote) => {
    const quotes = getLocalQuotes();
    quotes.unshift(quote);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
};

// --- FUNÇÕES PRINCIPAIS (AGORA ASSÍNCRONAS) ---

export const saveQuote = async (quoteData: Omit<SavedQuote, 'id' | 'createdAt'>): Promise<void> => {
    const newQuote: SavedQuote = {
        ...quoteData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
    };

    // 1. Tenta salvar no Supabase se estiver configurado
    if (supabase) {
        try {
            const { error } = await supabase
                .from('quotes')
                .insert([
                    { 
                        id: newQuote.id, 
                        content: newQuote // Salvamos o objeto todo dentro da coluna JSONB
                    }
                ]);

            if (error) {
                console.error('Erro ao salvar no Supabase:', error);
                // Fallback: Salva local se der erro na nuvem
                saveLocalQuote(newQuote);
                alert("Erro ao salvar na nuvem. Salvo localmente apenas.");
            }
            return;
        } catch (err) {
            console.error("Exceção Supabase:", err);
        }
    }

    // 2. Se não tem Supabase ou falhou, salva Local
    saveLocalQuote(newQuote);
};

export const getQuotes = async (): Promise<SavedQuote[]> => {
    // 1. Tenta buscar do Supabase
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('quotes')
                .select('content')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // Mapeia o resultado: a coluna 'content' tem o objeto SavedQuote
                return data.map((row: any) => row.content as SavedQuote);
            }
        } catch (err) {
            console.error('Erro ao buscar do Supabase, tentando local:', err);
        }
    }

    // 2. Retorna local se falhar nuvem
    return getLocalQuotes();
};

export const deleteQuote = async (id: string): Promise<void> => {
    let deletedFromCloud = false;

    if (supabase) {
        try {
            const { error } = await supabase
                .from('quotes')
                .delete()
                .eq('id', id);
            
            if (!error) deletedFromCloud = true;
            else console.error(error);
        } catch (e) {
            console.error(e);
        }
    }

    // Sempre deleta do local também para garantir sincronia visual se estiver misturado
    const quotes = getLocalQuotes();
    const filtered = quotes.filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};
