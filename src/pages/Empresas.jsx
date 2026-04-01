import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Building2, Pencil, Trash2, FileCheck2, SearchCheck, FileSpreadsheet, Mail, Link2, Layers, RotateCcw, Download, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import EmpresaCardDetalhes from "@/components/EmpresaCardDetalhes";
import * as XLSX from "xlsx";
import { Link, useNavigate } from "react-router-dom";
import EmpresaModal from "@/components/EmpresaModal";
import SolicitarBuscaModal from "@/components/SolicitarBuscaModal";
import ImportarEmpresasModal from "@/components/ImportarEmpresasModal";
import DocumentosEmpresa from "@/components/DocumentosEmpresa";
import SolicitarTJModal from "@/components/SolicitarTJModal";
import GerarLinkModal from "@/components/GerarLinkModal";

export default function Empresas() {
  const { theme } = useTheme();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [buscaEmpresa, setBuscaEmpresa] = useState(null);
  const [tjEmpresa, setTjEmpresa] = useState(null);
  const [linkEmpresa, setLinkEmpresa] = useState(null);
  const [importarOpen, setImportarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [lixeira, setLixeira] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Detalhe de empresa específica via URL
  const [empresaDetalhe, setEmpresaDetalhe] = useState(null);
  const [certidoesDetalhe, setCertidoesDetalhe] = useState([]);
  const [documentosDetalhe, setDocumentosDetalhe] = useState([]);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const empresaId = params.get("empresa");
    if (empresaId) {
      setLoadingDetalhe(true);
      Promise.all([
        base44.entities.Empresa.filter({ id: empresaId }),
        base44.entities.Certidao.filter({ empresa_id: empresaId }),
        base44.entities.DocumentoEmpresa.filter({ empresa_id: empresaId }),
      ]).then(([emps, certs, docs]) => {
        if (emps.length > 0) setEmpresaDetalhe(emps[0]);
        setCertidoesDetalhe(certs.filter(c => !c.excluida));
        setDocumentosDetalhe(docs);
        setLoadingDetalhe(false);
      });
    }
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    carregar();
  }, []);

  if (loadingDetalhe) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    </div>
  );

  if (empresaDetalhe) return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setEmpresaDetalhe(null); navigate("/Empresas"); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Empresas
        </button>
      </div>
      <EmpresaCardDetalhes
        empresa={empresaDetalhe}
        certidoes={certidoesDetalhe}
        documentos={documentosDetalhe}
      />
    </div>
  );

  const carregar = () => {
    base44.entities.Empresa.list().then(data => {
      setEmpresas(data);
      setLoading(false);
    });
  };

  const moverLixeira = async (id) => {
    if (!confirm("Mover esta empresa para a lixeira?")) return;
    await base44.entities.Empresa.update(id, { excluida: true });
    toast({ title: "🗑️ Empresa movida para a lixeira." });
    carregar();
  };

  const restaurar = async (id) => {
    await base44.entities.Empresa.update(id, { excluida: false });
    toast({ title: "✅ Empresa restaurada com sucesso!" });
    carregar();
  };

  const excluirPermanente = async (id) => {
    if (!confirm("Excluir permanentemente esta empresa? Esta ação não pode ser desfeita.")) return;
    await base44.entities.Empresa.delete(id);
    toast({ title: "🗑️ Empresa excluída permanentemente." });
    carregar();
  };

  const moverLixeiraEmLote = async () => {
    if (!confirm(`Mover ${selecionados.length} empresa(s) para a lixeira?`)) return;
    await Promise.all(selecionados.map(id => base44.entities.Empresa.update(id, { excluida: true })));
    setSelecionados([]);
    carregar();
  };

  const restaurarEmLote = async () => {
    await Promise.all(selecionados.map(id => base44.entities.Empresa.update(id, { excluida: false })));
    setSelecionados([]);
    carregar();
  };

  const exportarSelecionadas = () => {
    const empresasParaExportar = filtradas.filter(e => selecionados.includes(e.id));
    const dados = empresasParaExportar.map(e => ({
      "CNPJ": e.cnpj || "",
      "RAZÃO SOCIAL": e.nome || "",
      "RESPONSÁVEL": e.responsavel || "",
      "E-MAIL": e.email || "",
      "TELEFONE": e.telefone || "",
      "REGIME TRIBUTÁRIO": e.regime_tributario || "",
      "INSCRIÇÃO ESTADUAL": e.inscricao_estadual || "",
      "GRUPO EMPRESARIAL": e.grupo_nome || "",
      "STATUS": e.status === "ativo" ? "Ativo" : "Inativo",
    }));
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Empresas");
    XLSX.writeFile(wb, `empresas_exportadas.xlsx`);
  };

  const excluirPermanenteEmLote = async () => {
    if (!confirm(`Excluir permanentemente ${selecionados.length} empresa(s)? Esta ação não pode ser desfeita.`)) return;
    await Promise.all(selecionados.map(id => base44.entities.Empresa.delete(id)));
    setSelecionados([]);
    carregar();
  };

  const isAdmin = user?.role === "admin";

  const ativas = empresas.filter(e => !e.excluida);
  const naLixeira = empresas.filter(e => e.excluida);
  const listaAtual = lixeira ? naLixeira : ativas;

  const filtradas = listaAtual.filter(e =>
    e.nome?.toLowerCase().includes(search.toLowerCase()) ||
    e.cnpj?.includes(search)
  );

  const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" };
  const btnGhost = { border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4", background: "transparent", fontFamily: "'Rethink Sans', sans-serif" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>Empresas</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{ativas.length} ativa(s){naLixeira.length > 0 && ` · ${naLixeira.length} na lixeira`}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!lixeira && selecionados.length > 0 && (
            <>
              <button onClick={exportarSelecionadas} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl" style={{ border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", background: "rgba(34,197,94,0.08)" }}>
                <Download className="w-4 h-4" /> Exportar ({selecionados.length})
              </button>
              <button onClick={moverLixeiraEmLote} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl" style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", background: "rgba(239,68,68,0.08)" }}>
                <Trash2 className="w-4 h-4" /> Lixeira ({selecionados.length})
              </button>
            </>
          )}
          {lixeira && selecionados.length > 0 && (
            <>
              <button onClick={restaurarEmLote} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl" style={{ border: "1px solid rgba(58,141,255,0.3)", color: "#5E9BFF", background: "rgba(58,141,255,0.08)" }}>
                <RotateCcw className="w-4 h-4" /> Restaurar ({selecionados.length})
              </button>
              <button onClick={excluirPermanenteEmLote} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl" style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", background: "rgba(239,68,68,0.08)" }}>
                <Trash2 className="w-4 h-4" /> Excluir ({selecionados.length})
              </button>
            </>
          )}
          <button onClick={() => { setLixeira(v => !v); setSelecionados([]); }}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            style={{ border: lixeira ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.1)", color: lixeira ? "#f87171" : "#6B7FA3", background: lixeira ? "rgba(239,68,68,0.08)" : "transparent" }}>
            <Trash2 className="w-4 h-4" /> {lixeira ? "Sair da Lixeira" : "Lixeira"}
            {!lixeira && naLixeira.length > 0 && <span className="text-xs rounded-full w-4 h-4 flex items-center justify-center" style={{ background: "#ef4444", color: "#fff" }}>{naLixeira.length}</span>}
          </button>
          {!lixeira && (
            <>
              <button onClick={() => setImportarOpen(true)} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors" style={btnGhost}>
                <FileSpreadsheet className="w-4 h-4" /> Importar Planilha
              </button>
              <button onClick={() => navigate("/GruposEmpresariais")} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors" style={{ border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc", background: "rgba(168,85,247,0.08)" }}>
                <Layers className="w-4 h-4" /> Grupos Empresariais
              </button>
              <button onClick={() => { setEditando(null); setModalOpen(true); }}
                className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
                style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)", boxShadow: "0 0 20px rgba(58,141,255,0.3)", fontFamily: "'Manrope', sans-serif" }}>
                <Plus className="w-4 h-4" /> Nova Empresa
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7FA3" }} />
        <input className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}
          placeholder="Buscar por nome ou CNPJ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {lixeira && (
        <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontFamily: "'Rethink Sans', sans-serif" }}>
          Você está na lixeira. Empresas aqui podem ser restauradas ou excluídas permanentemente.
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={cardStyle}>
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#A0B1D4" }} />
          <p style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{lixeira ? "Lixeira vazia." : "Nenhuma empresa encontrada."}</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          {/* Barra de seleção */}
          <div className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Outfit', sans-serif" }}>{filtradas.length} resultado(s)</span>
            <button className="text-xs font-medium" style={{ color: "#5E9BFF", fontFamily: "'Rethink Sans', sans-serif" }}
              onClick={() => { if (selecionados.length === filtradas.length) setSelecionados([]); else setSelecionados(filtradas.map(e => e.id)); }}>
              {selecionados.length === filtradas.length ? "Desmarcar todos" : "Selecionar todos"}
            </button>
          </div>
          <div>
            {filtradas.map(empresa => {
              const isSel = selecionados.includes(empresa.id);
              return (
                <div key={empresa.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center justify-between px-5 py-4 cursor-pointer transition-colors"
                    style={{ background: isSel ? "rgba(58,141,255,0.08)" : "transparent" }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                    onClick={() => setSelecionados(prev => isSel ? prev.filter(id => id !== empresa.id) : [...prev, empresa.id])}>
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0" style={{ background: isSel ? "#3A8DFF" : "transparent", borderColor: isSel ? "#3A8DFF" : "rgba(255,255,255,0.2)" }}>
                        {isSel && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(58,141,255,0.1)" }}>
                        <Building2 className="w-5 h-5" style={{ color: "#5E9BFF" }} />
                      </div>
                      <div>
                        <p className="font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{empresa.nome}</p>
                        <p className="text-sm" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{empresa.cnpj} · {empresa.responsavel || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {!lixeira && (
                        <>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: empresa.status === "ativo" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)", color: empresa.status === "ativo" ? "#4ade80" : "#6B7FA3" }}>
                            {empresa.status === "ativo" ? "Ativo" : "Inativo"}
                          </span>
                          <button onClick={() => setTjEmpresa(empresa)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#c084fc"} onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"} title="Solicitar Certidão TJ-PA via email">
                            <Mail className="w-4 h-4" />
                          </button>
                          <button onClick={() => setLinkEmpresa(empresa)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#818cf8"} onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"} title="Gerar link compartilhável">
                            <Link2 className="w-4 h-4" />
                          </button>
                          <Link to={`/Certidoes?empresa=${empresa.id}`} className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#5E9BFF"} onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"} title="Ver certidões">
                            <FileCheck2 className="w-4 h-4" />
                          </Link>
                          {isAdmin && (
                            <>
                              <button onClick={() => { setEditando(empresa); setModalOpen(true); }} className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                                onMouseEnter={e => e.currentTarget.style.color = "#5E9BFF"} onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => moverLixeira(empresa.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                                onMouseEnter={e => e.currentTarget.style.color = "#ef4444"} onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"} title="Mover para lixeira">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                      {lixeira && isAdmin && (
                        <>
                          <button onClick={() => restaurar(empresa.id)} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ color: "#5E9BFF", border: "1px solid rgba(58,141,255,0.3)", background: "rgba(58,141,255,0.08)" }}>
                            <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                          </button>
                          <button onClick={() => excluirPermanente(empresa.id)} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {!lixeira && <DocumentosEmpresa empresa={empresa} isAdmin={isAdmin} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modalOpen && (
        <EmpresaModal
          empresa={editando}
          onClose={() => setModalOpen(false)}
          onSave={() => { setModalOpen(false); carregar(); }}
        />
      )}

      {buscaEmpresa && (
        <SolicitarBuscaModal
          empresa={buscaEmpresa}
          onClose={() => setBuscaEmpresa(null)}
          onSolicitado={() => { setBuscaEmpresa(null); }}
        />
      )}

      {tjEmpresa && (
        <SolicitarTJModal
          empresa={tjEmpresa}
          onClose={() => setTjEmpresa(null)}
        />
      )}

      {linkEmpresa && (
        <GerarLinkModal
          empresa={linkEmpresa}
          onClose={() => setLinkEmpresa(null)}
        />
      )}

      {importarOpen && (
        <ImportarEmpresasModal
          onClose={() => setImportarOpen(false)}
          onImportado={() => { setImportarOpen(false); carregar(); }}
        />
      )}
    </div>
  );
}