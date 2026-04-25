import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertTriangle, Plus, Search, Filter, X, Loader2, CheckCircle2 } from "lucide-react";
import PendenciaItem from "@/components/passivo/PendenciaItem";
import NovaPendenciaModal from "@/components/passivo/NovaPendenciaModal";

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };

const TRIBUTOS = ["PIS", "COFINS", "ICMS", "ISS", "IRPJ", "CSLL", "INSS", "FGTS", "OUTROS"];
const CRITICIDADES = ["alto", "medio", "baixo"];
const STATUS_LIST = ["aberta", "em_negociacao", "parcelada", "paga", "cancelada", "contestada"];

export default function PendenciasGlobal() {
  const [pendencias, setPendencias] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novaOpen, setNovaOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroTributo, setFiltroTributo] = useState("todos");
  const [filtroCrit, setFiltroCrit] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("aberta");

  const carregar = async () => {
    setLoading(true);
    const [pends, emps] = await Promise.all([
      base44.entities.PendenciaFiscal.list("-created_date", 500),
      base44.entities.Empresa.list(),
    ]);
    setPendencias(pends);
    setEmpresas(emps.filter(e => !e.excluida));
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const filtradas = useMemo(() => {
    return pendencias.filter(p => {
      const matchSearch = !search ||
        p.empresa_nome?.toLowerCase().includes(search.toLowerCase()) ||
        p.tipo_tributo?.includes(search.toUpperCase()) ||
        p.descricao?.toLowerCase().includes(search.toLowerCase());
      const matchTributo = filtroTributo === "todos" || p.tipo_tributo === filtroTributo;
      const matchCrit = filtroCrit === "todos" || p.criticidade === filtroCrit;
      const matchStatus = filtroStatus === "todos" || p.status === filtroStatus;
      return matchSearch && matchTributo && matchCrit && matchStatus;
    });
  }, [pendencias, search, filtroTributo, filtroCrit, filtroStatus]);

  const contadores = useMemo(() => ({
    alto: pendencias.filter(p => p.criticidade === "alto" && p.status === "aberta").length,
    total: pendencias.filter(p => p.status === "aberta").length,
    resolv: pendencias.filter(p => p.status === "paga").length,
  }), [pendencias]);

  const CRIT_LABELS = { todos: "Todas", alto: "🔴 Alto", medio: "🟡 Médio", baixo: "🟢 Baixo" };
  const STATUS_LABELS = { todos: "Todos Status", aberta: "Abertas", em_negociacao: "Em Negociação", parcelada: "Parceladas", paga: "Pagas", cancelada: "Canceladas", contestada: "Contestadas" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>Pendências Fiscais</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3" }}>{contadores.total} abertas · {contadores.alto} críticas · {contadores.resolv} pagas</p>
        </div>
        <button onClick={() => setNovaOpen(true)}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
          style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)" }}>
          <Plus className="w-4 h-4" /> Nova Pendência
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Abertas", value: contadores.total, color: "#FF9F1C", bg: "rgba(255,159,28,0.1)", border: "rgba(255,159,28,0.2)" },
          { label: "Críticas", value: contadores.alto, color: "#E63946", bg: "rgba(230,57,70,0.1)", border: "rgba(230,57,70,0.2)" },
          { label: "Resolvidas", value: contadores.resolv, color: "#1E9B5B", bg: "rgba(30,155,91,0.1)", border: "rgba(30,155,91,0.2)" },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3 text-center" style={{ background: k.bg, border: `1px solid ${k.border}` }}>
            <p className="text-2xl font-bold" style={{ color: k.color, fontFamily: "'Exo 2', sans-serif" }}>{k.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7FA3" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7FA3" }} />
          <input className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
            placeholder="Buscar por empresa, tributo ou descrição..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="rounded-xl px-3 py-2 text-xs focus:outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}
            value={filtroTributo} onChange={e => setFiltroTributo(e.target.value)}>
            <option value="todos" style={{ background: "#0A0D14" }}>Todos Tributos</option>
            {TRIBUTOS.map(t => <option key={t} value={t} style={{ background: "#0A0D14" }}>{t}</option>)}
          </select>
          <select className="rounded-xl px-3 py-2 text-xs focus:outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}
            value={filtroCrit} onChange={e => setFiltroCrit(e.target.value)}>
            {Object.entries(CRIT_LABELS).map(([k, v]) => <option key={k} value={k} style={{ background: "#0A0D14" }}>{v}</option>)}
          </select>
          <select className="rounded-xl px-3 py-2 text-xs focus:outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}
            value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k} style={{ background: "#0A0D14" }}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="rounded-2xl p-14 text-center" style={cardStyle}>
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#1E9B5B", opacity: 0.5 }} />
          <p style={{ color: "#6B7FA3" }}>Nenhuma pendência encontrada com os filtros selecionados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <div>
                <div className="text-xs mb-1 px-1" style={{ color: "#6B7FA3" }}>
                  <Link to={`/passivo/empresa?id=${p.empresa_id}`} className="hover:underline" style={{ color: "#5E9BFF" }}>
                    {p.empresa_nome || "Empresa não informada"}
                  </Link>
                </div>
                <PendenciaItem pendencia={p} onAtualizar={carregar} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {novaOpen && (
        <NovaPendenciaModal empresas={empresas} onClose={() => setNovaOpen(false)} onSalvo={() => { setNovaOpen(false); carregar(); }} />
      )}
    </div>
  );
}