// Contas do Dashboard: contratos fechados (foram pra produção) por mês, faturamento e material.

export const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// createdAt aparece em vários formatos: Timestamp do Firestore, ISO, "dd/mm/aaaa" ou número
export const parseContractDate = (value: any): Date | null => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    if (typeof value === 'number') return new Date(value);
    const s = String(value).trim();
    const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
};

// "Fechado" = contrato que foi pra produção (ou já entregue); falta assinar/pendente não conta
export const isClosedContract = (c: any) => c?.status === 'producao' || c?.status === 'entregue';

export const contractValue = (c: any) => {
    const n = Number(String(c?.totalValue ?? '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
};

const TREAD_LABELS: Record<string, string> = { wood: 'Madeira', metal: 'Metal', chapa_xadrez: 'Chapa Xadrez', chapa_vazada: 'Chapa Vazada' };

const treadOf = (c: any): string => {
    let raw = c?.treadMaterial;
    if (!raw && c?.contractData) {
        try {
            let d: any = c.contractData;
            for (let i = 0; i < 5 && typeof d === 'string'; i++) d = JSON.parse(d);
            raw = d?.inputData?.treadMaterial || d?.contractData?.inputData?.treadMaterial;
        } catch { /* contrato antigo sem JSON válido */ }
    }
    return TREAD_LABELS[raw] || 'Não informado';
};

export const buildDashboardStats = (contracts: any[], year: number) => {
    const closedByMonth = Array(12).fill(0);
    const revenueByMonth = Array(12).fill(0);
    const treadCount: Record<string, number> = {};
    let closedYear = 0, revenueYear = 0, inProduction = 0, toSign = 0;
    const years = new Set<number>();

    for (const c of contracts) {
        if (c?.isProduct || c?.isPurchaseOrder || c?.isVisitPanel || c?.isSupplier) continue;
        const status = c?.status || 'producao';
        if (status === 'producao') inProduction++;
        if (status === 'falta_assinar' || status === 'pendente') toSign++;
        const date = parseContractDate(c?.createdAt);
        if (!date) continue;
        if (isClosedContract({ status })) years.add(date.getFullYear());
        if (!isClosedContract({ status }) || date.getFullYear() !== year) continue;
        const m = date.getMonth();
        const v = contractValue(c);
        closedByMonth[m]++;
        revenueByMonth[m] += v;
        closedYear++;
        revenueYear += v;
        const t = treadOf(c);
        treadCount[t] = (treadCount[t] || 0) + 1;
    }

    return {
        closedByMonth, revenueByMonth, closedYear, revenueYear,
        averageTicket: closedYear ? revenueYear / closedYear : 0,
        inProduction, toSign,
        treads: Object.entries(treadCount).sort((a, b) => b[1] - a[1]),
        years: [...years].sort((a, b) => b - a),
    };
};
