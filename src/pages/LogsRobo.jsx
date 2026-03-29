import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { base44 } from "@/api/base44Client";
import { ClipboardList, Search, CheckCircle2, XCircle, AlertTriangle, Info, Building2 } from "lucide-react";

const statusConfig = {
  sucesso: { label: "Sucesso", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  falha: { label: "Falha", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
  aviso: { label: "Aviso", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: AlertTriangle },
  info: { label: "Info", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Info },
};

const tipoLabels = { federal: "Federal", estadual: "Estadual", municipal: "Municipal", fgts: "FGTS", trabalhista: "Trabalhista" };

export default function LogsRobo() {
  const { theme } = useTheme();
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
    const matchSearch =
      log.empresa_nome?.toLowerCase().includes(search.toLowerCase()) ||
      log.acao?.toLowerCase().includes(search.toLowerCase()) ||
      log.iniciada_por_nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filtroStatus === "todos" || log.status === filtroStatus;
    const matchTipo = filtroTipo === "todos" || log.tipo_certidao === filtroTipo;
    return matchSearch && matchStatus && matchTipo;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Logs de Auditoria</h1>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Histórico de ações do robô de busca</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] ${theme === 'dark' ? 'bg-white/10 border border-white/20 text-white' : 'border border-gray-200 bg-white'}`}
            placeholder="Buscar empresa, ação ou usuário..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
        >
          <option value="todos">Todos os status</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
        >
          <option value="todos">Todos os tipos</option>
          {Object.entries(tipoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div className={`rounded-xl p-16 text-center ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
          <ClipboardList className={`w-10 h-10 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Nenhum log encontrado.</p>
        </div>
      ) : (
        <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-white/5 border border-white/10 backdrop-blur-md' : 'bg-white border border-gray-200'}`}>
          <div className={`divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-gray-100'}`}>
            {filtrados.map(log => {
              const cfg = statusConfig[log.status] || statusConfig.info;
              const StatusIcon = cfg.icon;
              return (
                <div key={log.id} className={`px-5 py-4 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-0.5 p-1.5 rounded-lg border flex-shrink-0 ${cfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{log.empresa_nome}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            {tipoLabels[log.tipo_certidao]}
                          </span>
                        </div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{log.acao}</p>
                        {log.detalhes && (
                          <p className={`text-xs mt-0.5 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{log.detalhes}</p>
                        )}
                        {log.iniciada_por_nome && (
                          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>Por: {log.iniciada_por_nome}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleString("pt-BR")
                          : new Date(log.created_date).toLocaleString("pt-BR")}
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