import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  FileText, TrendingUp, CheckCircle2, XCircle, Clock,
  Send, Ban, Plus, ArrowRight, BarChart2
} from "lucide-react";
import DateRangeFilter, { getDateRange } from "@/components/emissor/DateRangeFilter";

const STATUS = {
  rascunho:    { label: "Rascunho",     cls: "bg-gray-100 text-gray-600" },
  validada:    { label: "Validada",     cls: "bg-blue-100 text-blue-700" },
  transmitindo:{ label: "Transmitindo", cls: "bg-amber-100 text-amber-700" },
  transmitida: { label: "Transmitida",  cls: "bg-emerald-100 text-emerald-700" },
  rejeitada:   { label: "Rejeitada",    cls: "bg-red-100 text-red-700" },
  cancelada:   { label: "Cancelada",    cls: "bg-gray-200 text-gray-500" },
};

const fmt = v => Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

export default function EmissorDashboard() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ preset: "mes_atual", range: getDateRange("mes_atual") });

  useEffect(() => {
    try {
      const c = localStorage.getItem("emissor_current_client");
      if (!c) { navigate("/emissor/painel"); return; }
      const parsed = JSON.parse(c);
      setClient(parsed);
      base44.entities.NotaFiscal55.filter({ empresa_id: parsed.id }).then(data => {
        setNotas(data);
        setLoading(false);
      });
    } catch { navigate("/emissor/painel"); }
  }, []);

  const filtradas = useMemo(() => {
    if (!dateFilter.range) return notas;
    return notas.filter(n => {
      const d = new Date(n.created_date);
      return d >= dateFilter.range.start && d <= dateFilter.range.end;
    });
  }, [notas, dateFilter]);

  const transmitidas = filtradas.filter(n => n.status_sefaz === "transmitida");
  const rejeitadas = filtradas.filter(n => n.status_sefaz === "rejeitada");
  const rascunhos = filtradas.filter(n => n.status_sefaz === "rascunho");
  const faturamento = transmitidas.reduce((s, n) => s + Number(n.valor_total || 0), 0);
  const ticketMedio = transmitidas.length > 0 ? faturamento / transmitidas.length : 0;

  // Curva ABC — top clientes por faturamento
  const topClientes = useMemo(() => {
    const map = {};
    transmitidas.forEach(n => {
      const nome = n.destinatario_nome || "Outros";
      if (!map[nome]) map[nome] = 0;
      map[nome] += Number(n.valor_total || 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [transmitidas]);

  const cards = [
    { label: "Faturamento", value: `R$ ${fmt(faturamento)}`, icon: TrendingUp, color: "#0B63D4", bg: "#E6F0FF", status: "transmitida" },
    { label: "NF-e Autorizadas", value: transmitidas.length, icon: CheckCircle2, color: "#059669", bg: "#ECFDF5", status: "transmitida" },
    { label: "Ticket Médio", value: `R$ ${fmt(ticketMedio)}`, icon: BarChart2, color: "#7C3AED", bg: "#EDE9FE", status: null },
    { label: "Rejeitadas", value: rejeitadas.length, icon: XCircle, color: "#DC2626", bg: "#FEF2F2", status: "rejeitada" },
    { label: "Rascunhos", value: rascunhos.length, icon: FileText, color: "#6B7280", bg: "#F3F4F6", status: "rascunho" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">{client?.razao_social}</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
          <Link to="/emissor/emitir"
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"
            style={{ backgroundColor: "#0B63D4" }}>
            <Plus className="w-4 h-4" /> Nova NF-e
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, status }) => (
          <button
            key={label}
            onClick={() => status && navigate(`/emissor/historico?status=${status}`)}
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left transition-shadow hover:shadow-md ${status ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5 truncate">{loading ? "—" : value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Curva ABC */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Top Clientes (Faturamento)</h2>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : topClientes.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sem notas autorizadas no período.</p>
          ) : (
            <div className="space-y-3">
              {topClientes.map(([nome, total], i) => {
                const pct = faturamento > 0 ? (total / faturamento) * 100 : 0;
                const cores = ["#0B63D4", "#059669", "#7C3AED", "#D97706", "#DC2626"];
                return (
                  <div key={nome}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 truncate max-w-[60%]">{nome}</span>
                      <span className="font-semibold text-gray-900">R$ {fmt(total)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cores[i] }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{pct.toFixed(1)}% do faturamento</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimas notas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Últimas Notas</h2>
            <Link to="/emissor/historico" className="text-xs font-medium flex items-center gap-1" style={{ color: "#0B63D4" }}>
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : filtradas.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Nenhuma nota no período.</p>
          ) : (
            <div className="space-y-2">
              {filtradas.slice(0, 6).map(nota => {
                const cfg = STATUS[nota.status_sefaz] || STATUS.rascunho;
                return (
                  <button key={nota.id} onClick={() => navigate(`/emissor/nota?id=${nota.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{nota.destinatario_nome || "—"}</p>
                      <p className="text-xs text-gray-400">{new Date(nota.created_date).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-900">
                        {nota.valor_total ? `R$ ${fmt(nota.valor_total)}` : "—"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}