
import { createClient } from '@supabase/supabase-js';

// Tenta pegar as variáveis de ambiente. 
// No Vite, geralmente é import.meta.env.VITE_..., mas como configuramos o process.env no vite.config:
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

const isConfigured = supabaseUrl && supabaseKey && supabaseUrl.startsWith('http') && supabaseKey.length > 20;

if (isConfigured) {
    console.log("✅ [Supabase] Cliente inicializado com sucesso.");
} else {
    console.warn("⚠️ [Supabase] Variáveis de ambiente ausentes. O app funcionará em modo OFFLINE (Local Storage).");
}

// Só cria o cliente se as chaves existirem e parecerem válidas
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
