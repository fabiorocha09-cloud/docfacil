import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, FileText, Tag, Loader2, X, Eye, AlertTriangle, BarChart2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import DropZone from "@/components/ui/DropZone";

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

const TIPO_CONFIG = {
  divergencia: {
    label: "Documento de Divergência",
    desc: "Extrato Fiscal SEFAZ, DIMP, relatórios com divergências identificadas",
    color: "#E63946",
    bg: "rgba(230,57,70,0.10)",
    border: "rgba(230,57,70,0.25)",
    icon: AlertTriangle,
  },
  report_cliente: {
    label: "Report ao Cliente",
    desc: "Documentos enviados ao cliente informando pendências e valores devidos",
    color: "#0B5FFF",
    bg: "rgba(11,95,255,0.10)",
    border: "rgba(11,95,255,0.25)",
    icon: BarChart2,
  },
};

function ModeloModal({ modelo, onClose, onSalvo }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    nome: modelo?.nome || "",
    tipo: modelo?.tipo || "divergencia",
    descricao: modelo?.descricao || "",
    tags: modelo?.tags?.join(", ") || "",
    ativo: modelo?.ativo !== false,
    arquivo_url: modelo?.arquivo_url || "",
    nome_arquivo: modelo?.nome_arquivo || "",
  });
  const [uploading, setUploading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const handleUpload = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, arquivo_url: file_url, nome_arquivo: file.name }));
    setUploading(false);
    toast({ title: "✅ Arquivo enviado!" });
  };

  const handleSalvar = async () => {
    if (!form.nome || !form.arquivo_url) {
      toast({ title: "Preencha o nome e envie um arquivo." });
      return;
    }
    setSalvando(true);
    const dados = {
      ...form,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    };
    if (modelo?.id) {
      await base44.entities.ModeloDocumentoPassivo.update(modelo.id, dados);
    } else {
      await base44.entities.ModeloDocumentoPassivo.create(dados);
    }
    toast({ title: "✅ Modelo salvo!" });
    setSalvando(false);
    onSalvo();
  };

  const tipoCfg = TIPO_CONFIG[form.tipo];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
        style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {modelo ? "Editar Modelo" : "Novo Modelo de Documento"}
          </h2>
          <button onClick={onClose} style={{ color: "#6B7FA3" }}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4 flex-1">
          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "#A0B1D4" }}>Tipo de Documento *</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TIPO_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const sel = form.tipo === key;
                return (
                  <button key={key} type="button" onClick={() => setForm(f => ({ ...f, tipo: key }))}
                    className="flex items-start gap-2 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: sel ? cfg.bg : "rgba(255,255,255,0.03)",
                      border: `1px solid ${sel ? cfg.border : "rgba(255,255,255,0.07)"}`,
                    }}>
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: sel ? cfg.color : "#6B7FA3" }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: sel ? cfg.color : "#A0B1D4" }}>{cfg.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#6B7FA3", lineHeight: "1.3" }}>{cfg.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Nome *</label>
            <input className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              placeholder="Ex: Extrato Fiscal SEFAZ - DIMP Cartão 2025"
              value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Descrição</label>
            <textarea rows={2} className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" style={inputStyle}
              placeholder="Descreva quando e como usar este modelo..."
              value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>
              Tags <span style={{ color: "#6B7FA3" }}>(separadas por vírgula)</span>
            </label>
            <input className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              placeholder="Ex: DIMP, PGDAS, ICMS, 2025"
              value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>

          {/* Upload */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "#A0B1D4" }}>Arquivo do Modelo *</label>
            {form.arquivo_url ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "rgba(30,155,91,0.08)", border: "1px solid rgba(30,155,91,0.2)" }}>
                <FileText className="w-5 h-5 flex-shrink-0" style={{ color: "#1E9B5B" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{form.nome_arquivo || "Arquivo enviado"}</p>
                  <a href={form.arquivo_url} target="_blank" rel="noreferrer"
                    className="text-xs" style={{ color: "#1E9B5B" }}>Visualizar arquivo →</a>
                </div>
                <button onClick={() => setForm(f => ({ ...f, arquivo_url: "", nome_arquivo: "" }))}
                  className="flex-shrink-0 text-xs px-2 py-1 rounded-lg"
                  style={{ color: "#E63946", border: "1px solid rgba(230,57,70,0.2)" }}>
                  Trocar
                </button>
              </div>
            ) : (
              <DropZone
                onFile={handleUpload}
                accept=".pdf,.doc,.docx"
                loading={uploading}
                label="Clique ou arraste PDF ou DOC aqui"
              />
            )}
          </div>
        </div>

        <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="flex-1 text-sm font-medium py-2 rounded-xl"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}>Cancelar</button>
          <button onClick={handleSalvar} disabled={salvando || !form.arquivo_url}
            className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)" }}>
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {salvando ? "Salvando..." : "Salvar Modelo"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ModelosDocumentosPassivo() {
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const { toast } = useToast();

  const carregar = async () => {
    setLoading(true);
    const m = await base44.entities.ModeloDocumentoPassivo.list("-created_date", 200);
    setModelos(m);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const deletar = async (id) => {
    if (!confirm("Excluir este modelo?")) return;
    await base44.entities.ModeloDocumentoPassivo.delete(id);
    toast({ title: "🗑️ Modelo excluído." });
    carregar();
  };

  const filtrados = filtroTipo === "todos" ? modelos : modelos.filter(m => m.tipo === filtroTipo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>
            Modelos de Documentos
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3" }}>
            Documentos de divergências DIMP/NF-e e relatórios enviados ao cliente
          </p>
        </div>
        <button onClick={() => { setEditando(null); setModalOpen(true); }}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
          style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)" }}>
          <Plus className="w-4 h-4" /> Novo Modelo
        </button>
      </div>

      {/* Tipos de documentos - info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(TIPO_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const count = modelos.filter(m => m.tipo === key).length;
          return (
            <div key={key} className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.bg }}>
                <Icon className="w-5 h-5" style={{ color: cfg.color }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: cfg.color, fontFamily: "'Manrope', sans-serif" }}>
                  {cfg.label} <span className="ml-1 text-xs font-normal" style={{ color: "#6B7FA3" }}>({count} modelo{count !== 1 ? "s" : ""})</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#6B7FA3" }}>{cfg.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", width: "fit-content" }}>
        {[{ key: "todos", label: "Todos" }, { key: "divergencia", label: "Divergências" }, { key: "report_cliente", label: "Reports ao Cliente" }].map(f => (
          <button key={f.key} onClick={() => setFiltroTipo(f.key)}
            className="text-xs font-medium px-4 py-2 rounded-lg transition-all"
            style={{
              background: filtroTipo === f.key ? "rgba(11,95,255,0.2)" : "transparent",
              color: filtroTipo === f.key ? "#5E9BFF" : "#6B7FA3",
              border: filtroTipo === f.key ? "1px solid rgba(11,95,255,0.35)" : "1px solid transparent",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl p-14 text-center" style={cardStyle}>
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#A0B1D4" }} />
          <p className="text-sm" style={{ color: "#6B7FA3" }}>
            Nenhum modelo cadastrado. Clique em "Novo Modelo" para adicionar.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          {filtrados.map((m, i) => {
            const cfg = TIPO_CONFIG[m.tipo] || TIPO_CONFIG.divergencia;
            const Icon = cfg.icon;
            return (
              <div key={m.id}
                className="flex items-center justify-between px-5 py-4 transition-colors"
                style={{ borderBottom: i < filtrados.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: "'Manrope', sans-serif" }}>{m.nome}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                    </div>
                    {m.descricao && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#6B7FA3" }}>{m.descricao}</p>
                    )}
                    {m.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {m.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.05)", color: "#A0B1D4", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <Tag className="w-2.5 h-2.5" />{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <a href={m.arquivo_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(11,95,255,0.1)", color: "#5E9BFF", border: "1px solid rgba(11,95,255,0.25)" }}>
                    <Eye className="w-3.5 h-3.5" /> Ver
                  </a>
                  <button onClick={() => { setEditando(m); setModalOpen(true); }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}>
                    Editar
                  </button>
                  <button onClick={() => deletar(m.id)}
                    className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#E63946"}
                    onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <ModeloModal modelo={editando} onClose={() => setModalOpen(false)} onSalvo={() => { setModalOpen(false); carregar(); }} />
      )}
    </div>
  );
}