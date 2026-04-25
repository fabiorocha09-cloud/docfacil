import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AlertTriangle, TrendingUp, TrendingDown, DollarSign,
  Building2, ChevronRight, RefreshCw, Loader2, BarChart2,
  ShieldAlert, Clock, CheckCircle2
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import PassivoKpiCard from "@/components/passivo/PassivoKpiCard";
import RiscoScoreBadge from "@/components/passivo/RiscoScoreBadge";

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);
const fmtPct = (v) => `${(v || 0).toFixed(1)}%`;

export default function PassivoDashboard() {
  const [empresas, setEmpresas] = useState([]);
  const [passivos, setPassivos] = useState([]);
  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const [emps, pvs, pends] = await Promise.all([
      base44.entities.Empresa.list(),
      base44.entities.PassivoTributario.list("-periodo", 500),
      base44.entities.PendenciaFiscal.list("-created_date", 500),
    ]);
    setEmpresas(emps.filter(e => !e.excluida));
    setPassivos(pvs);
    setPendencias(pends);
    if (isRefresh) setRefreshing(false); else setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  // KPIs agregados
  const kpis = useMemo(() => {
    const passivoTotal = passivos.reduce((s, p) => s + (p.total_passivo || 0), 0);
    const pendCriticas = pendencias.filter(p => p.criticidade === "alto" && p.status === "aberta").length;
    const faturTotal = passivos.reduce((s, p) => s + (p.faturamento_nfe || 0), 0);
    const declTotal = passivos.reduce((s, p) => s + (p.faturamento_declarado || 0), 0);
    const divergencia = faturTotal > 0 ? ((faturTotal - declTotal) / faturTotal) * 100 : 0;
    const scoresMedios = passivos.filter(p => p.score_risco > 0);
    const scoreMedio = scoresMedios.length > 0
      ? scoresMedios.reduce((s, p) => s + p.score_risco, 0) / scoresMedios.length
      : 0;
    return { passivoTotal, pendCriticas, divergencia, scoreMedio };
  }, [passivos, pendencias]);

  // Evolução mensal do passivo (últimos 12 meses)
  const evolucaoMensal = useMemo(() => {
    const map = {};
    passivos.forEach(p => {
      if (!p.periodo) return;
      if (!map[p.periodo]) map[p.periodo] = { periodo: p.periodo, passivo: 0, faturamento: 0 };
      map[p.periodo].passivo += p.total_passivo || 0;
      map[p.periodo].faturamento += p.faturamento_nfe || 0;
    });
    return Object.values(map).sort((a, b) => a.periodo.localeCompare(b.periodo)).slice(-12).map(m => ({
      ...m,
      name: m.periodo.slice(0, 7),
    }));
  }, [passivos]);

  // Top empresas por risco
  const topEmpresas = useMemo(() => {
    const map = {};
    passivos.forEach(p => {
      if (!p.empresa_id) return;
      if (!map[p.empresa_id]) map[p.empresa_id] = { empresa_id: p.empresa_id, empresa_nome: p.empresa_nome, total_passivo: 0, score_risco: 0, count: 0 };
      map[p.empresa_id].total_passivo += p.total_passivo || 0;
      map[p.empresa_id].score_risco += p.score_risco || 0;
      map[p.empresa_id].count++;
    });
    return Object.values(map)
      .map(e => ({ ...e, score_medio: e.count > 0 ? e.score_risco / e.count : 0 }))
      .sort((a, b) => b.score_medio - a.score_medio)
      .slice(0, 5);
  }, [passivos]);

  // Próximos vencimentos
  const proximosVencimentos = useMemo(() => {
    const hoje = new Date();
    return pendencias
      .filter(p => p.data_vencimento && p.status === "aberta")
      .map(p => ({ ...p, dias: Math.ceil((new Date(p.data_vencimento) - hoje) / 86400000) }))
      .filter(p => p.dias >= 0 && p.dias <= 90)
      .sort((a, b) => a.dias - b.dias)
      .slice(0, 5);
  }, [pendencias]);

  const cardVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: (i) => ({ y: 0, opacity: 1, transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1], delay: i * 0.04 } }),
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}
      </div>
      <div className="h-64 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>
            Passivo & Raio-X Fiscal
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>
            Visão consolidada de passivo tributário e pendências fiscais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => carregar(true)} disabled={refreshing}
            className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4", background: "transparent" }}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </button>
          <Link to="/passivo/pendencias"
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)" }}>
            <AlertTriangle className="w-4 h-4" /> Ver Pendências
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Passivo Total", value: fmt(kpis.passivoTotal), icon: DollarSign,
            color: "#E63946", bgColor: "rgba(230,57,70,0.12)", borderColor: "rgba(230,57,70,0.2)",
            sub: `${passivos.length} registros`,
          },
          {
            label: "Pendências Críticas", value: kpis.pendCriticas, icon: ShieldAlert,
            color: "#FF9F1C", bgColor: "rgba(255,159,28,0.12)", borderColor: "rgba(255,159,28,0.2)",
            sub: `${pendencias.filter(p => p.status === "aberta").length} abertas no total`,
          },
          {
            label: "Divergência Fatur. vs Decl.", value: fmtPct(kpis.divergencia), icon: TrendingUp,
            color: kpis.divergencia > 10 ? "#E63946" : "#1E9B5B",
            bgColor: kpis.divergencia > 10 ? "rgba(230,57,70,0.12)" : "rgba(30,155,91,0.12)",
            borderColor: kpis.divergencia > 10 ? "rgba(230,57,70,0.2)" : "rgba(30,155,91,0.2)",
            sub: "Faturamento real vs declarado",
          },
          {
            label: "Score Médio de Risco", value: `${kpis.scoreMedio.toFixed(0)}/100`, icon: BarChart2,
            color: kpis.scoreMedio > 70 ? "#E63946" : kpis.scoreMedio > 40 ? "#FF9F1C" : "#1E9B5B",
            bgColor: "rgba(11,95,255,0.12)", borderColor: "rgba(11,95,255,0.2)",
            sub: `${empresas.length} empresas monitoradas`,
          },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} initial="hidden" animate="visible" variants={cardVariants}>
            <PassivoKpiCard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Gráfico + Painel lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de evolução */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl p-5" style={cardStyle}>
          <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Evolução do Passivo — Últimos 12 meses
          </h3>
          {evolucaoMensal.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <BarChart2 className="w-8 h-8 mb-2 opacity-20" style={{ color: "#A0B1D4" }} />
              <p className="text-sm" style={{ color: "#6B7FA3" }}>Nenhum dado de passivo registrado ainda.</p>
              <Link to="/passivo/empresa" className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(11,95,255,0.15)", color: "#5E9BFF", border: "1px solid rgba(11,95,255,0.3)" }}>
                Calcular passivo de uma empresa
              </Link>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={evolucaoMensal}>
                <defs>
                  <linearGradient id="passivo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E63946" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="faturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B5FFF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0B5FFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#6B7FA3", fontSize: 11 }} />
                <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#6B7FA3", fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [fmt(v), n === "passivo" ? "Passivo" : "Faturamento"]}
                  contentStyle={{ background: "#0A0D14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#A0B1D4" }} itemStyle={{ color: "#fff" }} />
                <Legend wrapperStyle={{ color: "#6B7FA3", fontSize: 12 }} />
                <Area type="monotone" dataKey="faturamento" stroke="#0B5FFF" fill="url(#faturamento)" strokeWidth={2} name="Faturamento" />
                <Area type="monotone" dataKey="passivo" stroke="#E63946" fill="url(#passivo)" strokeWidth={2} name="Passivo" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Próximos vencimentos */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl p-5 space-y-3" style={cardStyle}>
          <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Próximos Vencimentos
          </h3>
          {proximosVencimentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <CheckCircle2 className="w-6 h-6 mb-1" style={{ color: "#1E9B5B" }} />
              <p className="text-xs" style={{ color: "#6B7FA3" }}>Nenhum vencimento nos próximos 90 dias</p>
            </div>
          ) : (
            proximosVencimentos.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl"
                style={{ background: p.dias <= 7 ? "rgba(230,57,70,0.08)" : p.dias <= 30 ? "rgba(255,159,28,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${p.dias <= 7 ? "rgba(230,57,70,0.2)" : p.dias <= 30 ? "rgba(255,159,28,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white truncate" style={{ fontFamily: "'Manrope', sans-serif" }}>{p.tipo_tributo}</p>
                  <p className="text-xs truncate" style={{ color: "#6B7FA3" }}>{p.empresa_nome}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-xs font-bold" style={{ color: p.dias <= 7 ? "#E63946" : p.dias <= 30 ? "#FF9F1C" : "#A0B1D4" }}>{p.dias}d</p>
                  <p className="text-xs" style={{ color: "#6B7FA3" }}>{fmt(p.valor_total)}</p>
                </div>
              </div>
            ))
          )}
          <Link to="/passivo/pendencias" className="block text-center text-xs font-medium py-2 rounded-xl mt-2"
            style={{ color: "#5E9BFF", border: "1px solid rgba(11,95,255,0.2)", background: "rgba(11,95,255,0.06)" }}>
            Ver todas as pendências →
          </Link>
        </motion.div>
      </div>

      {/* Tabela de empresas */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Empresas por Risco Fiscal
          </h3>
          <Link to="/passivo/empresa" className="text-xs font-medium" style={{ color: "#5E9BFF" }}>
            Ver todas →
          </Link>
        </div>
        <div>
          {topEmpresas.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "#A0B1D4" }} />
              <p className="text-sm mb-3" style={{ color: "#6B7FA3" }}>Nenhum dado calculado ainda.</p>
              <Link to="/passivo/empresa" className="text-sm font-medium px-4 py-2 rounded-xl"
                style={{ background: "rgba(11,95,255,0.15)", color: "#5E9BFF", border: "1px solid rgba(11,95,255,0.3)" }}>
                Iniciar análise fiscal
              </Link>
            </div>
          ) : (
            topEmpresas.map((emp, i) => (
              <Link to={`/passivo/empresa?id=${emp.empresa_id}`} key={emp.empresa_id}
                className="flex items-center justify-between px-5 py-3.5 transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold w-5 text-center" style={{ color: "#6B7FA3" }}>{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{emp.empresa_nome || "—"}</p>
                    <p className="text-xs" style={{ color: "#6B7FA3" }}>Passivo: {fmt(emp.total_passivo)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RiscoScoreBadge score={emp.score_medio} />
                  <ChevronRight className="w-4 h-4" style={{ color: "#6B7FA3" }} />
                </div>
              </Link>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}