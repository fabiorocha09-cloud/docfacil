import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Building2, FileText, AlertTriangle, CheckCircle2,
  TrendingUp, DollarSign, Loader2, Plus, RefreshCw, Calculator,
  ChevronDown, ChevronUp, ExternalLink, Clock, ShieldAlert
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart
} from "recharts";
import RiscoScoreBadge from "@/components/passivo/RiscoScoreBadge";
import PendenciaItem from "@/components/passivo/PendenciaItem";
import SimuladorParcelamento from "@/components/passivo/SimuladorParcelamento";
import CalcularPassivoModal from "@/components/passivo/CalcularPassivoModal";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);
const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };

const TRIBUTO_COLORS = {
  PIS: "#0B5FFF", COFINS: "#1E9B5B", ICMS: "#FF9F1C",
  ISS: "#9B59B6", IRPJ: "#E63946", CSLL: "#E91E63", INSS: "#00BCD4"
};

const ABAS = ["overview", "pendencias", "passivo", "faturamento", "simulador", "historico"];
const ABA_LABELS = {
  overview: "Visão Geral", pendencias: "Pendências", passivo: "Passivo",
  faturamento: "Fat. vs Decl.", simulador: "Simulador", historico: "Histórico"
};

export default function RaioXEmpresa() {
  const params = new URLSearchParams(window.location.search);
  const empresaId = params.get("id");

  const [empresa, setEmpresa] = useState(null);
  const [passivos, setPassivos] = useState([]);
  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState("overview");
  const [calcularOpen, setCalcularOpen] = useState(false);

  const carregar = async () => {
    if (!empresaId) { setLoading(false); return; }
    setLoading(true);
    const [emps, pvs, pends] = await Promise.all([
      base44.entities.Empresa.list(),
      base44.entities.PassivoTributario.filter({ empresa_id: empresaId }),
      base44.entities.PendenciaFiscal.filter({ empresa_id: empresaId }),
    ]);
    setEmpresa(emps.find(e => e.id === empresaId) || null);
    setPassivos(pvs.sort((a, b) => a.periodo?.localeCompare(b.periodo)));
    setPendencias(pends);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [empresaId]);

  const kpis = useMemo(() => {
    const passivoTotal = passivos.reduce((s, p) => s + (p.total_passivo || 0), 0);
    const abertas = pendencias.filter(p => p.status === "aberta").length;
    const faturTotal = passivos.reduce((s, p) => s + (p.faturamento_nfe || 0), 0);
    const declTotal = passivos.reduce((s, p) => s + (p.faturamento_declarado || 0), 0);
    const divergencia = faturTotal > 0 ? ((faturTotal - declTotal) / faturTotal) * 100 : 0;
    const scores = passivos.filter(p => p.score_risco > 0);
    const scoreMedio = scores.length > 0 ? scores.reduce((s, p) => s + p.score_risco, 0) / scores.length : 0;
    return { passivoTotal, abertas, faturTotal, divergencia, scoreMedio };
  }, [passivos, pendencias]);

  // Dados por tributo para donut
  const porTributo = useMemo(() => {
    const map = {};
    passivos.forEach(p => {
      ["pis", "cofins", "icms", "iss", "irpj", "csll", "inss"].forEach(t => {
        const due = p[`${t}_devido`] || 0;
        if (due > 0) {
          const key = t.toUpperCase();
          map[key] = (map[key] || 0) + due;
        }
      });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [passivos]);

  // Evolução mensal
  const evolucao = useMemo(() => passivos.slice(-12).map(p => ({
    name: p.periodo?.slice(0, 7) || "",
    passivo: p.total_passivo || 0,
    faturamento: p.faturamento_nfe || 0,
    declarado: p.faturamento_declarado || 0,
  })), [passivos]);

  if (!empresaId) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>Raio-X por Empresa</h1>
      <div className="rounded-2xl p-8 text-center" style={cardStyle}>
        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "#A0B1D4" }} />
        <p className="text-sm mb-4" style={{ color: "#6B7FA3" }}>Selecione uma empresa para visualizar o Raio-X fiscal.</p>
        <EmpresaSelector />
      </div>
    </div>
  );

  if (loading) return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <Link to="/passivo/dashboard" className="p-2 rounded-xl transition-colors mt-0.5"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#6B7FA3" }}
            onMouseEnter={e => e.currentTarget.style.color = "#A0B1D4"}
            onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                {empresa?.nome || "—"}
              </h1>
              <RiscoScoreBadge score={kpis.scoreMedio} />
            </div>
            <p className="text-sm mt-0.5" style={{ color: "#6B7FA3" }}>
              {empresa?.cnpj} · {empresa?.regime_tributario?.replace("_", " ")}
              {empresa?.grupo_nome && ` · Grupo: ${empresa.grupo_nome}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCalcularOpen(true)}
            className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl"
            style={{ border: "1px solid rgba(30,155,91,0.3)", color: "#1E9B5B", background: "rgba(30,155,91,0.08)" }}>
            <Calculator className="w-4 h-4" /> Calcular Passivo
          </button>
          <button onClick={carregar}
            className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Passivo Total", value: fmt(kpis.passivoTotal), color: "#E63946" },
          { label: "Pendências Abertas", value: kpis.abertas, color: "#FF9F1C" },
          { label: "Faturamento (12M)", value: fmt(kpis.faturTotal), color: "#0B5FFF" },
          { label: "Divergência", value: `${kpis.divergencia.toFixed(1)}%`, color: kpis.divergencia > 10 ? "#E63946" : "#1E9B5B" },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="rounded-xl p-4" style={cardStyle}>
            <p className="text-xs mb-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color, fontFamily: "'Exo 2', sans-serif" }}>{k.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Abas */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {ABAS.map(a => (
          <button key={a} onClick={() => setAba(a)}
            className="flex-shrink-0 text-xs font-medium px-3 py-2 rounded-lg transition-all"
            style={{
              background: aba === a ? "rgba(11,95,255,0.2)" : "transparent",
              color: aba === a ? "#5E9BFF" : "#6B7FA3",
              border: aba === a ? "1px solid rgba(11,95,255,0.35)" : "1px solid transparent",
              fontFamily: "'Outfit', sans-serif",
            }}>
            {ABA_LABELS[a]}
          </button>
        ))}
      </div>

      {/* Conteúdo por aba */}
      {aba === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Donut por tributo */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>Passivo por Tributo</h3>
            {porTributo.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm" style={{ color: "#6B7FA3" }}>Nenhum dado disponível</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={porTributo} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {porTributo.map((entry) => (
                      <Cell key={entry.name} fill={TRIBUTO_COLORS[entry.name] || "#6B7FA3"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "#0A0D14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Evolução do passivo */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>Evolução Mensal</h3>
            {evolucao.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm" style={{ color: "#6B7FA3" }}>Nenhum dado disponível</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={evolucao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: "#6B7FA3", fontSize: 10 }} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: "#6B7FA3", fontSize: 10 }} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "#0A0D14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                  <Bar dataKey="passivo" fill="#E63946" radius={[4, 4, 0, 0]} name="Passivo" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {aba === "pendencias" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: "#A0B1D4" }}>{pendencias.length} pendência(s)</p>
            <Link to="/passivo/pendencias" className="text-xs font-medium" style={{ color: "#5E9BFF" }}>
              + Nova Pendência
            </Link>
          </div>
          {pendencias.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={cardStyle}>
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: "#1E9B5B" }} />
              <p className="text-sm" style={{ color: "#6B7FA3" }}>Nenhuma pendência fiscal registrada.</p>
            </div>
          ) : (
            pendencias.map(p => <PendenciaItem key={p.id} pendencia={p} onAtualizar={carregar} />)
          )}
        </div>
      )}

      {aba === "passivo" && (
        <div className="space-y-3">
          {passivos.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={cardStyle}>
              <p className="text-sm mb-3" style={{ color: "#6B7FA3" }}>Nenhum cálculo de passivo registrado.</p>
              <button onClick={() => setCalcularOpen(true)} className="text-sm font-medium px-4 py-2 rounded-xl"
                style={{ background: "rgba(11,95,255,0.15)", color: "#5E9BFF", border: "1px solid rgba(11,95,255,0.3)" }}>
                Calcular Passivo
              </button>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["Período", "Faturamento NF-e", "Declarado", "Divergência", "Passivo Total", "Score"].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#6B7FA3", fontFamily: "'Outfit', sans-serif" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {passivos.map(p => (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td className="px-4 py-3 font-medium text-white">{p.periodo}</td>
                        <td className="px-4 py-3" style={{ color: "#A0B1D4" }}>{fmt(p.faturamento_nfe)}</td>
                        <td className="px-4 py-3" style={{ color: "#A0B1D4" }}>{fmt(p.faturamento_declarado)}</td>
                        <td className="px-4 py-3">
                          <span style={{ color: (p.divergencia_percentual || 0) > 10 ? "#E63946" : "#1E9B5B" }}>
                            {(p.divergencia_percentual || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold" style={{ color: "#E63946" }}>{fmt(p.total_passivo)}</td>
                        <td className="px-4 py-3"><RiscoScoreBadge score={p.score_risco} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {aba === "faturamento" && (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Faturamento NF-e vs Declarado (últimos 12 meses)
            </h3>
            {evolucao.length === 0 ? (
              <div className="text-center py-10 text-sm" style={{ color: "#6B7FA3" }}>Sem dados disponíveis</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={evolucao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: "#6B7FA3", fontSize: 11 }} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#6B7FA3", fontSize: 11 }} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "#0A0D14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ color: "#6B7FA3", fontSize: 12 }} />
                  <Bar dataKey="faturamento" fill="#0B5FFF" opacity={0.7} radius={[4, 4, 0, 0]} name="NF-e Emitidas" />
                  <Line type="monotone" dataKey="declarado" stroke="#FF9F1C" strokeWidth={2} dot={{ r: 3 }} name="Declarado" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {aba === "simulador" && (
        <SimuladorParcelamento empresa={empresa} passivos={passivos} pendencias={pendencias} />
      )}

      {aba === "historico" && (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>Log de Auditoria</h3>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {passivos.slice(-10).reverse().map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white">Passivo calculado — {p.periodo}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7FA3" }}>
                    Por: {p.calculado_por || "Sistema"} · {p.calculado_em ? new Date(p.calculado_em).toLocaleString("pt-BR") : "—"}
                  </p>
                </div>
                <span className="text-xs font-semibold" style={{ color: "#E63946" }}>{fmt(p.total_passivo)}</span>
              </div>
            ))}
            {passivos.length === 0 && (
              <div className="px-5 py-10 text-center text-sm" style={{ color: "#6B7FA3" }}>Nenhum histórico disponível.</div>
            )}
          </div>
        </div>
      )}

      {calcularOpen && (
        <CalcularPassivoModal empresa={empresa} onClose={() => setCalcularOpen(false)} onSalvo={() => { setCalcularOpen(false); carregar(); }} />
      )}
    </div>
  );
}

function EmpresaSelector() {
  const [empresas, setEmpresas] = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => { base44.entities.Empresa.list().then(e => setEmpresas(e.filter(x => !x.excluida))); }, []);
  const filtradas = empresas.filter(e => e.nome?.toLowerCase().includes(search.toLowerCase()) || e.cnpj?.includes(search));
  return (
    <div className="w-full max-w-md mx-auto mt-2 text-left">
      <input className="w-full rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
        placeholder="Buscar empresa..." value={search} onChange={e => setSearch(e.target.value)} />
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {filtradas.slice(0, 20).map(e => (
          <Link key={e.id} to={`/passivo/empresa?id=${e.id}`}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            onMouseEnter={ev => ev.currentTarget.style.background = "rgba(11,95,255,0.1)"}
            onMouseLeave={ev => ev.currentTarget.style.background = "rgba(255,255,255,0.04)"}>
            <div>
              <p className="text-sm font-medium text-white">{e.nome}</p>
              <p className="text-xs" style={{ color: "#6B7FA3" }}>{e.cnpj}</p>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "#6B7FA3" }} />
          </Link>
        ))}
      </div>
    </div>
  );
}

// import missing from lucide
import { ChevronRight } from "lucide-react";