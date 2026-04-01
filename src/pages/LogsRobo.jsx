import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ClipboardList, Search, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

const statusConfig = {
  sucesso: { label: "Sucesso",  bg: "rgba(34,197,94,0.15)",  color: "#4ade80",  border: "rgba(34,197,94,0.3)",  icon: CheckCircle2 },
  falha:   { label: "Falha",   bg: "rgba(239,68,68,0.15)",  color: "#f87171",  border: "rgba(239,68,68,0.3)",  icon: XCircle },
  aviso:   { label: "Aviso",   bg: "rgba(234,179,8,0.15)",  color: "#fcd34d",  border: "rgba(234,179,8,0.3)",  icon: AlertTriangle },
  info:    { label: "Info",    bg: "rgba(58,141,255,0.15)", color: "#5E9BFF",  border: "rgba(58,141,255,0.3)", icon: Info },
};

const tipoLabels = { federal: "Federal", estadual: "Estadual", municipal: "Municipal", fgts: "FGTS", trabalhista: "Trabalhista" };

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

export default function LogsRobo() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  useEffect(() => {
    base44.entities.LogRobo.list("-created_date", 200).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const filtrados = logs.filter(log => {
    const matchSearch = log.empresa_nome?.toLowerCase().includes(search.toLowerCase()) ||
      log.acao?.toLowerCase().includes(search.toLowerCase()) ||
      log.iniciada_por_nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filtroStatus === "todos" || log.status === filtroStatus;
    const matchTipo = filtroTipo === "todos" || log.tipo_certidao === filtroTipo;
    return matchSearch && matchStatus && matchTipo;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>Logs de Auditoria</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Histórico de ações do robô de busca</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7FA3" }} />
          <input className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }}
            placeholder="Buscar empresa, ação ou usuário..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
          style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }}
          value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="todos" style={{ background: "#0A0D14" }}>Todos os status</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k} style={{ background: "#0A0D14" }}>{v.label}</option>)}
        </select>
        <select className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
          style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }}
          value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="todos" style={{ background: "#0A0D14" }}>Todos os tipos</option>
          {Object.entries(tipoLabels).map(([k, v]) => <option key={k} value={k} style={{ background: "#0A0D14" }}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}</div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={cardStyle}>
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#A0B1D4" }} />
          <p style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Nenhum log encontrado.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div>
            {filtrados.map(log => {
              const cfg = statusConfig[log.status] || statusConfig.info;
              const StatusIcon = cfg.icon;
              return (
                <div key={log.id} className="px-5 py-4 transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5 p-1.5 rounded-lg flex-shrink-0"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <StatusIcon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-medium text-sm text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{log.empresa_nome}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "#A0B1D4", fontFamily: "'Outfit', sans-serif" }}>
                            {tipoLabels[log.tipo_certidao]}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>{log.acao}</p>
                        {log.detalhes && <p className="text-xs mt-0.5 truncate" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{log.detalhes}</p>}
                        {log.iniciada_por_nome && <p className="text-xs mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Por: {log.iniciada_por_nome}</p>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontFamily: "'Outfit', sans-serif" }}>
                        {cfg.label}
                      </span>
                      <p className="text-xs mt-1.5" style={{ color: "#6B7FA3", fontFamily: "'Outfit', sans-serif" }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString("pt-BR") : new Date(log.created_date).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}