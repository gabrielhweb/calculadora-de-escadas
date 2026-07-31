export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, message } = req.body;

    if (!email || !message) {
        return res.status(400).json({ error: 'Faltando email ou mensagem.' });
    }

    // Configurações do EmailJS
    // Você pode substituir essas variáveis chumbadas no código por process.env.Variavel no painel da Vercel para mais segurança futura.
    const SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'service_et2wtl7'; 
    const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || 'COLE_SEU_NOVO_TEMPLATE_ID_AQUI'; 
    const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || 'pNnojqJb7tjg3sjYV';

    if (TEMPLATE_ID === 'COLE_SEU_NOVO_TEMPLATE_ID_AQUI' || TEMPLATE_ID.includes('test-mail')) {
        return res.status(400).json({ error: 'Configuração de Email pendente. O TEMPLATE_ID não é válido.' });
    }

    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: SERVICE_ID,
                template_id: TEMPLATE_ID,
                user_id: PUBLIC_KEY,
                template_params: {
                    to_email: email,
                    message: message,
                    from_name: "Zilinski Sistema",
                    reply_to: email
                }
            })
        });

        if (response.ok) {
            return res.status(200).json({ success: true });
        } else {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Erro desconhecido.' });
    }
}
