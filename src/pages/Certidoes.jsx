import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, FileCheck2, Download, Pencil, Trash2, CheckCircle2, XCircle, Clock, AlertTriangle, FolderDown } from "lucide-react";
import CertidaoModal from "@/components/CertidaoModal";
import DownloadLoteModal from "@/components/DownloadLoteModal";

const statusConfig = {
  regular: { label: "Regular", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  irregular: { label: "Irregular", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
  pendente: { label: "Pendente", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: Clock },
  processando: { label: "Processando", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Clock },
  erro: { label: "Erro", color: "text-gray-700 bg-gray-50 border-gray-200", icon: AlertTriangle },
};

const tipoLabels = { federal: "Federal", estadual: "Estadual", municipal: "Municipal", fgts: "FGTS", trabalhista: "Trabalhista" };

export default function Certidoes() {
  const [certidoes, setCertidoes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [user, setUser] = useState(null);
  const [selecionados, setSelecionados] = useState([]);
  const [downloadLoteOpen, setDownloadLoteOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    // Pegar filtro de empresa da URL
    const params = new URLSearchParams(window.location.search);
    const empresaParam = params.get("empresa");
    carregar(empresaParam);
    base44.entities.Empresa.list().then(setEmpresas);
  }, []);

  const carregar = async (empresaFiltro = null) => {
    let data = await base44.entities.Certidao.list("-created_date", 200);
    if (empresaFiltro) data = data.filter(c => c.empresa_id === empresaFiltro);
    setCertidoes(data);
    setLoading(false);
  };

  const deletar = async (id) => {
    if (!confirm("Deseja remover esta certidão?")) return;
    await base44.entities.Certidao.delete(id);
    carregar();
  };

  const isAdmin = user?.role === "admin";

  const filtradas = certidoes.filter(c => {
    const matchSearch = c.empresa_nome?.toLowerCase().includes(search.toLowerCase()) || c.empresa_cnpj?.includes(search) || c.subtipo?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filtroTipo === "todos" || c.tipo === filtroTipo;
    const matchStatus = filtroStatus === "todos" || c.status === filtroStatus;
    return matchSearch && matchTipo && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certidões</h1>
          <p className="text-gray-500 text-sm mt-1">{certidoes.length} certidão(ões) registrada(s)</p>
        </div>
        <div className="flex items-center gap-2">
          {selecionados.length > 0 && (
            <button
              onClick={() => setDownloadLoteOpen(true)}
              className="flex items-center gap-2 border border-blue-300 text-blue-700 dark:text-blue-400 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              <FolderDown className="w-4 h-4" /> Baixar ({selecionados.length})
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => { setEditando(null); setModalOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Nova Certidão
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buscar empresa ou certidão..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="todos">Todos os tipos</option>
          {Object.entries(tipoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="todos">Todos os status</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <FileCheck2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma certidão encontrada.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">{filtradas.length} resultado(s)</span>
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => {
                if (selecionados.length === filtradas.length) setSelecionados([]);
                else setSelecionados(filtradas.map(c => c.id));
              }}
            >
              {selecionados.length === filtradas.length ? "Desmarcar todos" : "Selecionar todos"}
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtradas.map(cert => {
              const cfg = statusConfig[cert.status] || statusConfig.pendente;
              const StatusIcon = cfg.icon;
              const isSel = selecionados.includes(cert.id);
              return (
                <div
                  key={cert.id}
                  className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${isSel ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  onClick={() => setSelecionados(prev => isSel ? prev.filter(id => id !== cert.id) : [...prev, cert.id])}
                >
                  <div className="flex items-center gap-3 mr-3 flex-shrink-0">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSel ? "bg-blue-600 border-blue-600" : "border-gray-300 dark:border-gray-600"}`}>
                      {isSel && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-gray-900 truncate">{cert.empresa_nome}</p>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tipoLabels[cert.tipo]}</span>
                      {cert.subtipo && <span className="text-xs text-gray-400">{cert.subtipo}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{cert.empresa_cnpj}</span>
                      {cert.data_emissao && <span>Emitida: {new Date(cert.data_emissao).toLocaleDateString("pt-BR")}</span>}
                      {cert.data_vencimento && <span>Vence: {new Date(cert.data_vencimento).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4" onClick={e => e.stopPropagation()}>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </div>
                    {cert.arquivo_url && (
                      <a href={cert.arquivo_url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Baixar PDF">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    {isAdmin && (
                      <>
                        <button onClick={() => { setEditando(cert); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deletar(cert.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {downloadLoteOpen && (
        <DownloadLoteModal
          certidoes={filtradas.filter(c => selecionados.includes(c.id))}
          onClose={() => setDownloadLoteOpen(false)}
        />
      )}

      {modalOpen && (
        <CertidaoModal
          certidao={editando}
          empresas={empresas}
          onClose={() => setModalOpen(false)}
          onSave={() => { setModalOpen(false); carregar(); }}
        />
      )}
    </div>
  );
}