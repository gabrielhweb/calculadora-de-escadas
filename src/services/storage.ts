
import { SavedQuote, QuoteStatus, ProjectFile } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'zilinski_quotes';

// --- FUNÇÕES AUXILIARES LOCAIS ---
const getLocalQuotes = (): SavedQuote[] => {
    const existingData = localStorage.getItem(STORAGE_KEY);
    return existingData ? JSON.parse(existingData) : [];
};

const saveLocalQuote = (quote: SavedQuote) => {
    const quotes = getLocalQuotes();
    // Remove versão antiga se existir e adiciona a nova no topo
    const filtered = quotes.filter(q => q.id !== quote.id);
    filtered.unshift(quote);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// --- FUNÇÕES PRINCIPAIS ---

// AGORA RETORNA O ID (STRING) PARA PODERMOS REDIRECIONAR
export const saveQuote = async (quoteData: Omit<SavedQuote, 'id' | 'createdAt' | 'status' | 'attachments'> & { id?: string, status?: QuoteStatus }): Promise<string> => {
    
    // Se já vier com ID (atualização), usa ele. Se não, cria novo.
    const id = quoteData.id || Date.now().toString();
    
    const newQuote: SavedQuote = {
        ...quoteData,
        id: id,
        createdAt: new Date().toISOString(), // Poderia manter a data original se fosse update, mas atualizar data é bom para ordenação
        status: quoteData.status || 'draft',
        attachments: []
    };

    // Tenta preservar anexos se for update local
    if (quoteData.id) {
        const old = await getQuoteById(quoteData.id);
        if (old && old.attachments) {
            newQuote.attachments = old.attachments;
        }
    }

    if (supabase) {
        try {
            // Upsert (Insert ou Update)
            const { error } = await supabase
                .from('quotes')
                .upsert({ id: newQuote.id, content: newQuote });

            if (error) {
                console.error('Erro ao salvar no Supabase (Fallback Local):', error);
                saveLocalQuote(newQuote);
                alert("Salvo localmente (Erro na nuvem ou tabela não criada).");
            }
        } catch (err) {
            console.error("Exceção Supabase:", err);
            saveLocalQuote(newQuote);
        }
    } else {
        saveLocalQuote(newQuote);
    }

    return id;
};

export const updateQuote = async (quote: SavedQuote): Promise<void> => {
    if (supabase) {
        try {
            const { error } = await supabase
                .from('quotes')
                .update({ content: quote })
                .eq('id', quote.id);
            
            if (error) throw error;
        } catch (e) {
            console.error('Erro ao atualizar nuvem', e);
        }
    }
    saveLocalQuote(quote);
};

// Nova função específica para mudar status (mais eficiente)
export const updateQuoteStatus = async (id: string, newStatus: QuoteStatus): Promise<void> => {
    const quotes = await getQuotes();
    const target = quotes.find(q => q.id === id);
    if (target) {
        target.status = newStatus;
        await updateQuote(target);
    }
};

// Adicionar anexo ao projeto
export const addAttachmentToQuote = async (quoteId: string, file: ProjectFile): Promise<void> => {
    const quotes = await getQuotes();
    const target = quotes.find(q => q.id === quoteId);
    if (target) {
        if (!target.attachments) target.attachments = [];
        target.attachments.push(file);
        await updateQuote(target);
    }
};

export const getQuotes = async (): Promise<SavedQuote[]> => {
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('quotes')
                .select('content')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                return data.map((row: any) => row.content as SavedQuote);
            }
        } catch (err) {
            console.error('Erro ao buscar do Supabase, tentando local:', err);
        }
    }
    return getLocalQuotes();
};

export const getQuoteById = async (id: string): Promise<SavedQuote | undefined> => {
    const quotes = await getQuotes();
    return quotes.find(q => q.id === id);
}

export const deleteQuote = async (id: string): Promise<void> => {
    if (supabase) {
        try {
            const { error } = await supabase.from('quotes').delete().eq('id', id);
            if (error) console.error(error);
        } catch (e) { console.error(e); }
    }
    const quotes = getLocalQuotes();
    const filtered = quotes.filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// --- UPLOAD DE ARQUIVOS ---
export const uploadProjectFile = async (file: File, quoteId: string): Promise<ProjectFile | null> => {
    const fileName = `${quoteId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
    if (supabase) {
        try {
            // Tenta subir para o bucket 'project-files'
            // O usuário precisa criar este bucket no painel do Supabase e deixá-lo público
            const { error } = await supabase.storage
                .from('project-files')
                .upload(fileName, file);

            if (error) {
                console.warn("Bucket não encontrado ou erro de permissão. Verifique se o bucket 'project-files' existe e é público.");
                throw error;
            }

            const { data: publicUrlData } = supabase.storage
                .from('project-files')
                .getPublicUrl(fileName);

            return {
                id: Date.now().toString(),
                name: file.name,
                type: file.type.startsWith('image') ? 'image' : 'video',
                url: publicUrlData.publicUrl,
                uploadedAt: new Date().toISOString()
            };

        } catch (e) {
            console.warn("Upload falhou, usando modo local temporário.", e);
        }
    }

    // Fallback Local (apenas para demonstração se não tiver backend)
    return {
        id: Date.now().toString(),
        name: file.name,
        type: file.type.startsWith('image') ? 'image' : 'video',
        url: URL.createObjectURL(file), // Isso só dura até o refresh da página
        uploadedAt: new Date().toISOString()
    };
};
