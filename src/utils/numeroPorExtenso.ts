export function numeroPorExtenso(numero: number): string {
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const dez_dezenove = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    function converteCentena(n: number): string {
        if (n === 100) return 'cem';
        const c = Math.floor(n / 100);
        const d = Math.floor((n % 100) / 10);
        const u = n % 10;
        
        let res = centenas[c];
        
        if (d === 1) {
            res += (res ? ' e ' : '') + dez_dezenove[u];
            return res;
        } else if (d > 1) {
            res += (res ? ' e ' : '') + dezenas[d];
        }
        
        if (u > 0) {
            res += (res ? ' e ' : '') + unidades[u];
        }
        
        return res;
    }

    function converteMilhar(n: number): string {
        const m = Math.floor(n / 1000);
        const c = n % 1000;
        
        let res = '';
        if (m === 1) {
            res = 'mil';
        } else if (m > 1) {
            res = converteCentena(m) + ' mil';
        }
        
        if (c > 0) {
            const strC = converteCentena(c);
            // adiciona 'e' se a centena for < 100 ou multiplo de 100
            if (c < 100 || c % 100 === 0) {
                res += (res ? ' e ' : '') + strC;
            } else {
                res += (res ? ' ' : '') + strC;
            }
        }
        
        return res;
    }

    function converteMilhao(n: number): string {
        const mi = Math.floor(n / 1000000);
        const resto = n % 1000000;
        
        let res = '';
        if (mi === 1) {
            res = 'um milhão';
        } else if (mi > 1) {
            res = converteCentena(mi) + ' milhões';
        }
        
        if (resto > 0) {
            const strR = converteMilhar(resto);
            if (resto < 100 || resto % 100 === 0 || Math.floor(resto / 1000) === 0) {
                res += ' e ' + strR;
            } else {
                res += ' ' + strR;
            }
        }
        
        return res;
    }

    if (numero === 0) return 'zero reais';

    const reais = Math.floor(numero);
    const centavos = Math.round((numero - reais) * 100);

    let strReais = '';
    if (reais === 1) strReais = 'um real';
    else if (reais > 1) {
        if (reais < 1000) strReais = converteCentena(reais) + ' reais';
        else if (reais < 1000000) strReais = converteMilhar(reais) + ' reais';
        else strReais = converteMilhao(reais) + (reais % 1000000 === 0 ? ' de reais' : ' reais');
    }

    let strCentavos = '';
    if (centavos === 1) strCentavos = 'um centavo';
    else if (centavos > 1) strCentavos = converteCentena(centavos) + ' centavos';

    if (strReais && strCentavos) return strReais + ' e ' + strCentavos;
    if (strReais) return strReais;
    return strCentavos;
}
