import { useEffect, useState } from "react";
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
        <h1 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h1>
        <p className="text-gray-500 text-sm mt-1">Histórico de ações do robô de busca</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum log encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtrados.map(log => {
              const cfg = statusConfig[log.status] || statusConfig.info;
              const StatusIcon = cfg.icon;
              return (
                <div key={log.id} className="px-5 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-0.5 p-1.5 rounded-lg border flex-shrink-0 ${cfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-medium text-gray-900 text-sm">{log.empresa_nome}</p>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {tipoLabels[log.tipo_certidao]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{log.acao}</p>
                        {log.detalhes && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{log.detalhes}</p>
                        )}
                        {log.iniciada_por_nome && (
                          <p className="text-xs text-gray-400 mt-1">Por: {log.iniciada_por_nome}</p>
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