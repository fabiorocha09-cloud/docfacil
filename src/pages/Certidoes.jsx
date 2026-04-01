import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, FileCheck2, Download, Pencil, Trash2, CheckCircle2, XCircle, Clock, AlertTriangle, FolderDown, RotateCcw, Trash, MinusCircle, Ban } from "lucide-react";
import { TIPOS_CERTIDAO, TIPOS_CONSOLIDADOS_MATRIZ } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import CertidaoModal from "@/components/CertidaoModal";
import DownloadLoteModal from "@/components/DownloadLoteModal";

const statusConfig = {
  regular:      { label: "Regular",       color: "rgba(34,197,94,0.15)",   textColor: "#4ade80",  borderColor: "rgba(34,197,94,0.3)",   icon: CheckCircle2 },
  irregular:    { label: "Irregular",     color: "rgba(239,68,68,0.15)",   textColor: "#f87171",  borderColor: "rgba(239,68,68,0.3)",   icon: XCircle },
  pendente:     { label: "Pendente",      color: "rgba(234,179,8,0.15)",   textColor: "#fcd34d",  borderColor: "rgba(234,179,8,0.3)",   icon: Clock },
  processando:  { label: "Processando",  color: "rgba(58,141,255,0.15)",  textColor: "#5E9BFF",  borderColor: "rgba(58,141,255,0.3)",  icon: Clock },
  erro:         { label: "Erro",          color: "rgba(255,255,255,0.07)", textColor: "#6B7FA3",  borderColor: "rgba(255,255,255,0.1)", icon: AlertTriangle },
  ausente:      { label: "Ausente",       color: "rgba(251,146,60,0.15)",  textColor: "#fb923c",  borderColor: "rgba(251,146,60,0.3)",  icon: MinusCircle },
  nao_aplicavel:{ label: "Não Aplicável", color: "rgba(255,255,255,0.07)", textColor: "#6B7FA3",  borderColor: "rgba(255,255,255,0.1)", icon: Ban },
};

const tipoLabels = Object.fromEntries(TIPOS_CERTIDAO.map(t => [t.tipo, t.label]));

const getStatusEfetivo = (cert) => {
  if (cert.data_vencimento && new Date(cert.data_vencimento) < new Date()) return "irregular";
  return cert.status;
};

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

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
    const virtuais = [];
    for (const emp of empresasFiltradas) {
      const naoAplicaveis = emp.certidoes_nao_aplicaveis || [];
      for (const { tipo } of TIPOS_CERTIDAO) {
        if (emp.cnpj_matriz && TIPOS_CONSOLIDADOS_MATRIZ.includes(tipo)) continue;
        const existe = reais.some(c => !c.excluida && c.empresa_id === emp.id && c.tipo === tipo);
        if (!existe) {
          virtuais.push({ id: `virtual_${emp.id}_${tipo}`, empresa_id: emp.id, empresa_nome: emp.nome, empresa_cnpj: emp.cnpj, tipo, status: naoAplicaveis.includes(tipo) ? "nao_aplicavel" : "ausente", _virtual: true });
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>Certidões</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>
            {certidoesAtivas.length} certidão(ões) ativa(s){certidoesLixeira.length > 0 && ` · ${certidoesLixeira.length} na lixeira`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!lixeira && selecionados.length > 0 && (
            <>
              <button onClick={moverLixeiraEmLote}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl"
                style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", background: "rgba(239,68,68,0.08)" }}>
                <Trash className="w-4 h-4" /> Lixeira ({selecionados.length})
              </button>
              <button onClick={() => setDownloadLoteOpen(true)}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl"
                style={{ border: "1px solid rgba(58,141,255,0.3)", color: "#5E9BFF", background: "rgba(58,141,255,0.08)" }}>
                <FolderDown className="w-4 h-4" /> Baixar ({selecionados.length})
              </button>
            </>
          )}
          <button onClick={() => { setLixeira(v => !v); setSelecionados([]); }}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            style={lixeira
              ? { border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", background: "rgba(239,68,68,0.12)" }
              : { border: "1px solid rgba(255,255,255,0.1)", color: "#6B7FA3", background: "transparent" }}>
            <Trash className="w-4 h-4" /> {lixeira ? "Sair da Lixeira" : "Lixeira"}
            {!lixeira && certidoesLixeira.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{certidoesLixeira.length}</span>
            )}
          </button>
          {isAdmin && !lixeira && (
            <button onClick={() => { setEditando(null); setModalOpen(true); }}
              className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
              <Plus className="w-4 h-4" /> Nova Certidão
            </button>
          )}
        </div>
      </div>

      {!lixeira && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7FA3" }} />
            <input className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }}
              placeholder="Buscar empresa ou certidão..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }}
            value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="todos">Todos os tipos</option>
            {Object.entries(tipoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }}
            value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="todos">Todos os status</option>
            <option value="__vencendo7__">Vencendo em 7 dias</option>
            {Object.entries(statusConfig).filter(([k]) => !["ausente","nao_aplicavel"].includes(k)).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            <option value="ausente">Ausente</option>
            <option value="nao_aplicavel">Não Aplicável</option>
          </select>
        </div>
      )}

      {lixeira && (
        <div className="rounded-2xl p-4 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontFamily: "'Rethink Sans', sans-serif" }}>
          Você está visualizando a lixeira. Itens aqui podem ser restaurados ou excluídos permanentemente.
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}</div>
      ) : listaExibida.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={cardStyle}>
          <FileCheck2 className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#A0B1D4" }} />
          <p style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{lixeira ? "Lixeira vazia." : "Nenhuma certidão encontrada."}</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          {!lixeira && (
            <div className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{filtradas.length} resultado(s)</span>
              <button className="text-xs font-medium transition-colors"
                style={{ color: "#5E9BFF", fontFamily: "'Rethink Sans', sans-serif" }}
                onClick={() => {
                  if (selecionados.length === filtradas.length) setSelecionados([]);
                  else setSelecionados(filtradas.map(c => c.id));
                }}>
                {selecionados.length === filtradas.length ? "Desmarcar todos" : "Selecionar todos"}
              </button>
            </div>
          )}
          <div>
            {listaExibida.map(cert => {
              const statusEfetivo = cert._virtual ? cert.status : getStatusEfetivo(cert);
              const cfg = statusConfig[statusEfetivo] || statusConfig.pendente;
              const StatusIcon = cfg.icon;
              const isSel = !cert._virtual && selecionados.includes(cert.id);
              return (
                <div key={cert.id}
                  className="flex items-center justify-between px-5 py-4 transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: !lixeira ? "pointer" : "default", background: isSel ? "rgba(58,141,255,0.08)" : "transparent" }}
                  onClick={() => !lixeira && !cert._virtual && setSelecionados(prev => isSel ? prev.filter(id => id !== cert.id) : [...prev, cert.id])}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                  {!lixeira && (
                    <div className="flex items-center mr-3 flex-shrink-0">
                      <div className="w-4 h-4 rounded border-2 flex items-center justify-center"
                        style={{ background: isSel ? "#3A8DFF" : "transparent", borderColor: isSel ? "#3A8DFF" : "rgba(255,255,255,0.2)" }}>
                        {isSel && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-medium text-white truncate" style={{ fontFamily: "'Manrope', sans-serif" }}>{cert.empresa_nome}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "#A0B1D4", fontFamily: "'Outfit', sans-serif" }}>{tipoLabels[cert.tipo]}</span>
                      {cert.subtipo && <span className="text-xs" style={{ color: "#6B7FA3" }}>{cert.subtipo}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>
                      <span>{cert.empresa_cnpj}</span>
                      {cert.data_emissao && <span>Emitida: {new Date(cert.data_emissao).toLocaleDateString("pt-BR")}</span>}
                      {cert.data_vencimento && <span>Vence: {new Date(cert.data_vencimento).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4" onClick={e => e.stopPropagation()}>
                    {(cert._virtual || !lixeira) && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: cfg.color, color: cfg.textColor, border: `1px solid ${cfg.borderColor}`, fontFamily: "'Outfit', sans-serif" }}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </div>
                    )}
                    {!lixeira && !cert._virtual && (
                      <>
                        {cert.arquivo_url && (
                          <a href={cert.arquivo_url} target="_blank" rel="noreferrer"
                            className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#5E9BFF"}
                            onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        {isAdmin && (
                          <>
                            <button onClick={() => { setEditando(cert); setModalOpen(true); }}
                              className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                              onMouseEnter={e => e.currentTarget.style.color = "#5E9BFF"}
                              onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => moverLixeira(cert.id)}
                              className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                              onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                              onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {lixeira && isAdmin && (
                      <>
                        <button onClick={() => restaurar(cert.id)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                          style={{ color: "#5E9BFF", border: "1px solid rgba(58,141,255,0.3)", background: "rgba(58,141,255,0.08)" }}>
                          <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                        </button>
                        <button onClick={() => excluirPermanente(cert.id)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                          style={{ color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
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
        <DownloadLoteModal certidoes={filtradas.filter(c => selecionados.includes(c.id))} onClose={() => setDownloadLoteOpen(false)} />
      )}
      {modalOpen && (
        <CertidaoModal certidao={editando} empresas={empresas} onClose={() => setModalOpen(false)} onSave={() => { setModalOpen(false); carregar(); }} />
      )}
    </div>
  );
}