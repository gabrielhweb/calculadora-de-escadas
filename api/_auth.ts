// Arquivo com "_" na frente: a Vercel não publica como rota, só serve de import para as funções.

// Única lista de quem pode usar o sistema (o AuthProvider do site importa daqui).
export const AUTHORIZED_EMAILS = [
    'zilinskidistribuidora@gmail.com',
    'somarcilioz@gmail.com',
    'gaguisilva15@gmail.com'
];

// Chave web pública do Firebase (a mesma de firebase-applet-config.json, não é segredo).
const FIREBASE_WEB_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDdXvLcGf8MiO0qd2FN31xCBcDxznCS1qA';

// Confere o token do Firebase E se o e-mail está na lista. Responde 401/403 e devolve false se não puder.
// Só validar o token não basta: o Firebase emite token para qualquer conta Google antes do site deslogar a pessoa.
export async function requireAuthorizedUser(req: any, res: any): Promise<boolean> {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
        res.status(401).json({ error: 'Acesso negado: faça login.' });
        return false;
    }
    try {
        const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token })
        });
        const verifyData = await verifyRes.json();
        const email = verifyData?.users?.[0]?.email;
        if (verifyData.error || !email) {
            res.status(401).json({ error: 'Acesso negado: login inválido ou expirado.' });
            return false;
        }
        if (!AUTHORIZED_EMAILS.includes(email)) {
            res.status(403).json({ error: 'Acesso negado: e-mail sem permissão.' });
            return false;
        }
        return true;
    } catch (e) {
        res.status(500).json({ error: 'Erro ao validar login.' });
        return false;
    }
}
