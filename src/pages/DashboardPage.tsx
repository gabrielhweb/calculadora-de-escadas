import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import PageTitle from '../components/PageTitle';
import { formatCurrencyBRL } from '../utils';
import { buildDashboardStats, MONTHS, MONTH_NAMES } from '../utils/dashboardStats';

// Gráfico de barras simples (sem biblioteca): número em cima de cada barra
const BarChart: React.FC<{ values: number[]; color: string; format?: (v: number) => string }> = ({ values, color, format = (v) => String(v) }) => {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-2 h-56 pt-6">
      {values.map((v, i) => (
        <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1 min-w-0">
          {v > 0 && <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">{format(v)}</span>}
          <div className="w-full max-w-[44px]" style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 4 : 0, background: color }} title={`${MONTH_NAMES[i]}: ${format(v)}`} />
          <span className="text-[11px] text-gray-500 dark:text-gray-400">{MONTHS[i]}</span>
        </div>
      ))}
    </div>
  );
};

const Kpi: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="of-plate p-4">
    <div className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">{label}</div>
    <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</div>
    {hint && <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{hint}</div>}
  </div>
);

const shortBRL = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace('.', ',')} mil` : formatCurrencyBRL(v));

export default function DashboardPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'contracts'), (snap) => {
      setContracts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const stats = useMemo(() => buildDashboardStats(contracts, year), [contracts, year]);
  const years = stats.years.includes(year) ? stats.years : [year, ...stats.years];
  const now = new Date();
  const treadMax = Math.max(1, ...stats.treads.map(([, n]) => n));

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex flex-col items-center justify-center h-[50vh] text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Acesso Restrito</h2>
        <p className="text-gray-500 dark:text-gray-400">Faça login para ver o dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <PageTitle info="Escadas vendidas por mês (contratos que foram pra produção ou já entregues, pela data em que o contrato foi criado), faturamento e materiais.">Dashboard</PageTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Contratos fechados = foram pra produção (falta assinar não conta).</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
          Ano
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label={`Escadas fechadas ${year}`} value={String(stats.closedYear)} />
        <Kpi label={`Faturamento ${year}`} value={formatCurrencyBRL(stats.revenueYear)} />
        <Kpi label="Ticket médio" value={formatCurrencyBRL(stats.averageTicket)} />
        <Kpi label="Em produção agora" value={String(stats.inProduction)} />
        <Kpi label="Falta assinar" value={String(stats.toSign)} hint="Contratos ainda não fechados" />
      </div>

      <div className="of-plate p-6">
        <h2 className="of-stencil text-xl text-gray-900 dark:text-white">Fechamentos por mês</h2>
        <BarChart values={stats.closedByMonth} color="#15803d" />
        <h3 className="of-stencil text-base text-gray-900 dark:text-white mt-8 mb-3">Resumo mensal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          {MONTH_NAMES.map((name, i) => (
            <div key={name} className={`flex justify-between px-3 py-2 text-sm ${i % 2 === 0 ? 'bg-white/70 dark:bg-gray-700/40' : ''}`}>
              <span className="text-gray-700 dark:text-gray-200">
                {name}{year === now.getFullYear() && i >= now.getMonth() ? '*' : ''}
              </span>
              <span className="font-black text-green-700 dark:text-green-400">{stats.closedByMonth[i]}</span>
            </div>
          ))}
        </div>
        {year === now.getFullYear() && <p className="text-[11px] text-gray-500 mt-2">* mês em andamento ou ainda não chegou</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="of-plate p-6 lg:col-span-2">
          <h2 className="of-stencil text-xl text-gray-900 dark:text-white">Faturamento por mês</h2>
          <BarChart values={stats.revenueByMonth} color="#d97706" format={shortBRL} />
        </div>
        <div className="of-plate p-6">
          <h2 className="of-stencil text-xl text-gray-900 dark:text-white mb-4">Material do pisante</h2>
          {stats.treads.length === 0 && <p className="text-sm text-gray-500">Nenhum contrato fechado em {year}.</p>}
          <div className="space-y-3">
            {stats.treads.map(([label, n]) => (
              <div key={label}>
                <div className="flex justify-between text-sm"><span className="text-gray-700 dark:text-gray-200">{label}</span><span className="font-bold">{n}</span></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 mt-1"><div className="h-3 bg-gray-800 dark:bg-gray-300" style={{ width: `${(n / treadMax) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
