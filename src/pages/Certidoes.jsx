import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, FileCheck2, Download, Pencil, Trash2, CheckCircle2, XCircle, Clock, AlertTriangle, FolderDown, RotateCcw, Trash, MinusCircle, Ban } from "lucide-react";
import { TIPOS_CERTIDAO, TIPOS_CONSOLIDADOS_MATRIZ } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import CertidaoModal from "@/components/CertidaoModal";
import DownloadLoteModal from "@/components/DownloadLoteModal";

const statusConfig = {
  regular: { label: "Regular", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  irregular: { label: "Irregular", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
  pendente: { label: "Pendente", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: Clock },
  processando: { label: "Processando", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Clock },
  erro: { label: "Erro", color: "text-gray-700 bg-gray-50 border-gray-200", icon: AlertTriangle },
  ausente: { label: "Ausente", color: "text-orange-700 bg-orange-50 border-orange-200", icon: MinusCircle },
  nao_aplicavel: { label: "Não Aplicável", color: "text-gray-500 bg-gray-100 border-gray-200", icon: Ban },
};

const tipoLabels = Object.fromEntries(TIPOS_CERTIDAO.map(t => [t.tipo, t.label]));

// Retorna status efetivo: se vencida, trata como irregular
const getStatusEfetivo = (cert) => {
  if (cert.data_vencimento && new Date(cert.data_vencimento) < new Date()) return "irregular";
  return cert.status;
};

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
  const [lixeira, setLixeira] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const empresaParam = params.get("empresa");
    const statusParam = params.get("status");
    const vencimentoParam = params.get("vencimento");

    if (statusParam) setFiltroStatus(statusParam);
    if (vencimentoParam === "7dias") setFiltroStatus("__vencendo7__");

    carregar(empresaParam);
  }, []);

  const carregar = async (empresaFiltro = null) => {
    const [data, emps] = await Promise.all([
      base44.entities.Certidao.list("-created_date", 500),
      base44.entities.Empresa.list(),
    ]);
    setEmpresas(emps);

    const reais = empresaFiltro ? data.filter(c => c.empresa_id === empresaFiltro) : data;
    const empresasFiltradas = empresaFiltro ? emps.filter(e => e.id === empresaFiltro) : emps.filter(e => !e.excluida);

    // Gera entradas virtuais para certidões ausentes
    const virtuais = [];
    for (const emp of empresasFiltradas) {
      const naoAplicaveis = emp.certidoes_nao_aplicaveis || [];
      for (const { tipo } of TIPOS_CERTIDAO) {
        // Filial: tipos consolidados da matriz não geram ausência
        if (emp.cnpj_matriz && TIPOS_CONSOLIDADOS_MATRIZ.includes(tipo)) continue;
        const existe = reais.some(c => !c.excluida && c.empresa_id === emp.id && c.tipo === tipo);
        if (!existe) {
          virtuais.push({
            id: `virtual_${emp.id}_${tipo}`,
            empresa_id: emp.id,
            empresa_nome: emp.nome,
            empresa_cnpj: emp.cnpj,
            tipo,
            status: naoAplicaveis.includes(tipo) ? "nao_aplicavel" : "ausente",
            _virtual: true,
          });
        }
      }
    }

    setCertidoes([...reais, ...virtuais]);
    setLoading(false);
  };

  const moverLixeira = async (id) => {
    if (!confirm("Mover esta certidão para a lixeira?")) return;
    await base44.entities.Certidao.update(id, { excluida: true });
    toast({ title: "🗑️ Certidão movida para a lixeira." });
    carregar();
  };

  const restaurar = async (id) => {
    await base44.entities.Certidao.update(id, { excluida: false });
    toast({ title: "✅ Certidão restaurada com sucesso!" });
    carregar();
  };

  const excluirPermanente = async (id) => {
    if (!confirm("Excluir permanentemente esta certidão? Não há reversão.")) return;
    await base44.entities.Certidao.delete(id);
    toast({ title: "🗑️ Certidão excluída permanentemente." });
    carregar();
  };

  const moverLixeiraEmLote = async () => {
    if (!confirm(`Mover ${selecionados.length} certidão(ões) para a lixeira?`)) return;
    await Promise.all(selecionados.map(id => base44.entities.Certidao.update(id, { excluida: true })));
    setSelecionados([]);
    carregar();
  };

  const isAdmin = user?.role === "admin";

  const hoje = new Date();

  const certidoesAtivas = certidoes.filter(c => c._virtual || !c.excluida);
  const certidoesLixeira = certidoes.filter(c => !c._virtual && c.excluida);

  const filtradas = certidoesAtivas.filter(c => {
    const matchSearch = c.empresa_nome?.toLowerCase().includes(search.toLowerCase()) || c.empresa_cnpj?.includes(search) || c.subtipo?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filtroTipo === "todos" || c.tipo === filtroTipo;

    if (filtroStatus === "__vencendo7__") {
      if (!c.data_vencimento) return false;
      const diff = (new Date(c.data_vencimento) - hoje) / (1000 * 60 * 60 * 24);
      return matchSearch && matchTipo && diff >= 0 && diff <= 7;
    }

    const statusEfetivo = c._virtual ? c.status : getStatusEfetivo(c);
    const matchStatus = filtroStatus === "todos" || statusEfetivo === filtroStatus;
    return matchSearch && matchTipo && matchStatus;
  });

  const listaExibida = lixeira ? certidoesLixeira : filtradas;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Certidões</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{certidoesAtivas.length} certidão(ões) ativa(s){certidoesLixeira.length > 0 && ` · ${certidoesLixeira.length} na lixeira`}</p>
        </div>
        <div className="flex items-center gap-2">
          {!lixeira && selecionados.length > 0 && (
            <>
              <button
                onClick={moverLixeiraEmLote}
                className="flex items-center gap-2 border border-red-200 text-red-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50"
              >
                <Trash className="w-4 h-4" /> Lixeira ({selecionados.length})
              </button>
              <button
                onClick={() => setDownloadLoteOpen(true)}
                className="flex items-center gap-2 border border-blue-300 text-blue-700 dark:text-blue-400 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                <FolderDown className="w-4 h-4" /> Baixar ({selecionados.length})
              </button>
            </>
          )}
          <button
            onClick={() => { setLixeira(v => !v); setSelecionados([]); }}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${lixeira ? "bg-red-50 border-red-200 text-red-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <Trash className="w-4 h-4" /> {lixeira ? "Sair da Lixeira" : "Lixeira"}
            {!lixeira && certidoesLixeira.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{certidoesLixeira.length}</span>}
          </button>
          {isAdmin && !lixeira && (
            <button
              onClick={() => { setEditando(null); setModalOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Nova Certidão
            </button>
          )}
        </div>
      </div>

      {!lixeira && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="Buscar empresa ou certidão..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="todos">Todos os tipos</option>
            {Object.entries(tipoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="todos">Todos os status</option>
            <option value="__vencendo7__">Vencendo em 7 dias</option>
            {Object.entries(statusConfig).filter(([k]) => !["ausente","nao_aplicavel"].includes(k)).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            <option value="ausente">Ausente</option>
            <option value="nao_aplicavel">Não Aplicável</option>
          </select>
        </div>
      )}

      {lixeira && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          Você está visualizando a lixeira. Itens aqui podem ser restaurados ou excluídos permanentemente.
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : listaExibida.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
          <FileCheck2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{lixeira ? "Lixeira vazia." : "Nenhuma certidão encontrada."}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {!lixeira && (
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
          )}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {listaExibida.map(cert => {
            const statusEfetivo = cert._virtual ? cert.status : getStatusEfetivo(cert);
            const cfg = statusConfig[statusEfetivo] || statusConfig.pendente;
            const StatusIcon = cfg.icon;
            const isSel = !cert._virtual && selecionados.includes(cert.id);
              return (
                <div
                  key={cert.id}
                  className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!lixeira ? "cursor-pointer" : ""} ${isSel ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  onClick={() => !lixeira && !cert._virtual && setSelecionados(prev => isSel ? prev.filter(id => id !== cert.id) : [...prev, cert.id])}
                >
                  {!lixeira && (
                    <div className="flex items-center gap-3 mr-3 flex-shrink-0">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSel ? "bg-blue-600 border-blue-600" : "border-gray-300 dark:border-gray-600"}`}>
                        {isSel && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{cert.empresa_nome}</p>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{tipoLabels[cert.tipo]}</span>
                      {cert.subtipo && <span className="text-xs text-gray-400">{cert.subtipo}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{cert.empresa_cnpj}</span>
                      {cert.data_emissao && <span>Emitida: {new Date(cert.data_emissao).toLocaleDateString("pt-BR")}</span>}
                      {cert.data_vencimento && <span>Vence: {new Date(cert.data_vencimento).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4" onClick={e => e.stopPropagation()}>
                    {cert._virtual && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </div>
                    )}
                    {!lixeira && !cert._virtual && (
                      <>
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
                            <button onClick={() => moverLixeira(cert.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {lixeira && isAdmin && (
                      <>
                        <button onClick={() => restaurar(cert.id)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline px-2 py-1 border border-blue-200 rounded-lg hover:bg-blue-50">
                          <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                        </button>
                        <button onClick={() => excluirPermanente(cert.id)} className="flex items-center gap-1 text-xs text-red-600 hover:underline px-2 py-1 border border-red-200 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
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