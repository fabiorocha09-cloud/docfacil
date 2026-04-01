import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, Trash2, Loader2, BookOpen, Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const TIPOS = [
  { value: "federal", label: "Federal" },
  { value: "estadual", label: "Estadual" },
  { value: "municipal", label: "Municipal" },
  { value: "fgts", label: "FGTS" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "alvara_bombeiros", label: "Alvará - Bombeiros" },
  { value: "alvara_vigilancia_sanitaria", label: "Alvará - Vigilância Sanitária" },
  { value: "alvara_funcionamento", label: "Alvará - Funcionamento" },
  { value: "alvara_meio_ambiente", label: "Alvará - Meio Ambiente" },
];

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

function ModeloModal({ modelo, onClose, onSave }) {
  const { toast } = useToast();
  const [form, setForm] = useState(modelo || { tipo: "estadual", subtipo: "", estado_municipio: "", descricao: "", arquivo_url: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, arquivo_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (modelo?.id) await base44.entities.ModeloDocumento.update(modelo.id, form);
    else await base44.entities.ModeloDocumento.create(form);
    toast({ title: "✅ Modelo salvo com sucesso!", duration: 3000 });
    onSave();
  };

  const inputCls = "w-full rounded-xl px-3 py-2 text-sm focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{modelo ? "Editar Modelo" : "Novo Modelo de Documento"}</h2>
          <button onClick={onClose} style={{ color: "#6B7FA3" }}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(58,141,255,0.08)", border: "1px solid rgba(58,141,255,0.2)", color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>
            📌 Envie um documento real como <strong style={{ color: "#5E9BFF" }}>exemplo padrão</strong>. A IA usará este modelo para identificar melhor certidões do mesmo tipo/estado/município.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>Tipo *</label>
              <select required className={inputCls} style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }}
                value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value, subtipo: "" }))}>
                {TIPOS.map(t => <option key={t.value} value={t.value} style={{ background: "#0A0D14" }}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>Subtipo</label>
              <input className={inputCls} style={inputStyle} placeholder="Ex: SEFAZ-PA"
                value={form.subtipo} onChange={e => setForm(f => ({ ...f, subtipo: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>Estado / Município</label>
            <input className={inputCls} style={inputStyle} placeholder="Ex: PA, Belém-PA, SP..."
              value={form.estado_municipio} onChange={e => setForm(f => ({ ...f, estado_municipio: e.target.value }))} />
            <p className="text-xs mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Deixe em branco se o modelo for genérico.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>Descrição</label>
            <input className={inputCls} style={inputStyle} placeholder="Ex: Certidão SEFAZ Pará - modelo 2024"
              value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>Documento Exemplo *</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Enviando..." : form.arquivo_url ? "Substituir" : "Enviar Arquivo"}
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
              {form.arquivo_url && (
                <a href={form.arquivo_url} target="_blank" rel="noreferrer" className="text-sm" style={{ color: "#5E9BFF" }}>Ver arquivo</a>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 text-sm font-medium py-2 rounded-xl"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}>Cancelar</button>
            <button type="submit" disabled={saving || uploading || !form.arquivo_url}
              className="flex-1 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
              {saving ? "Salvando..." : "Salvar Modelo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ModelosDocumento() {
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const { toast } = useToast();

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    setLoading(true);
    const data = await base44.entities.ModeloDocumento.list();
    setModelos(data);
    setLoading(false);
  };

  const deletar = async (id) => {
    if (!confirm("Remover este modelo?")) return;
    await base44.entities.ModeloDocumento.delete(id);
    toast({ title: "🗑️ Modelo removido.", duration: 3000 });
    carregar();
  };

  const filtrados = filtroTipo === "todos" ? modelos : modelos.filter(m => m.tipo === filtroTipo);
  const porTipo = {};
  filtrados.forEach(m => { if (!porTipo[m.tipo]) porTipo[m.tipo] = []; porTipo[m.tipo].push(m); });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>Modelos de Documento</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Envie documentos exemplo para treinar a IA a reconhecer certidões por estado/município</p>
        </div>
        <button onClick={() => { setEditando(null); setModalOpen(true); }}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
          style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
          <Plus className="w-4 h-4" /> Novo Modelo
        </button>
      </div>

      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <span className="text-lg">💡</span>
        <div style={{ color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "#818cf8", fontFamily: "'Manrope', sans-serif" }}>Como funciona</p>
          <p className="text-sm">Ao fazer upload de certidões, a IA compara o novo documento com os modelos cadastrados aqui para identificar com mais precisão o tipo, estado e município — especialmente útil para alvarás e certidões estaduais/municipais.</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltroTipo("todos")}
          className="text-xs px-3 py-1.5 rounded-full transition-colors"
          style={{
            background: filtroTipo === "todos" ? "rgba(58,141,255,0.2)" : "rgba(255,255,255,0.04)",
            border: filtroTipo === "todos" ? "1px solid rgba(58,141,255,0.5)" : "1px solid rgba(255,255,255,0.08)",
            color: filtroTipo === "todos" ? "#5E9BFF" : "#6B7FA3",
            fontFamily: "'Outfit', sans-serif",
          }}>
          Todos ({modelos.length})
        </button>
        {TIPOS.map(t => {
          const count = modelos.filter(m => m.tipo === t.value).length;
          if (count === 0) return null;
          const isActive = filtroTipo === t.value;
          return (
            <button key={t.value} onClick={() => setFiltroTipo(t.value)}
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{
                background: isActive ? "rgba(58,141,255,0.2)" : "rgba(255,255,255,0.04)",
                border: isActive ? "1px solid rgba(58,141,255,0.5)" : "1px solid rgba(255,255,255,0.08)",
                color: isActive ? "#5E9BFF" : "#6B7FA3",
                fontFamily: "'Outfit', sans-serif",
              }}>
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}</div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={cardStyle}>
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#A0B1D4" }} />
          <p className="mb-4" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Nenhum modelo cadastrado ainda.</p>
          <button onClick={() => { setEditando(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
            <Plus className="w-4 h-4" /> Adicionar Primeiro Modelo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {TIPOS.map(({ value: tipo, label }) => {
            const items = porTipo[tipo];
            if (!items || items.length === 0) return null;
            return (
              <div key={tipo} className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{label}</span>
                  <span className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Outfit', sans-serif" }}>{items.length} modelo(s)</span>
                </div>
                <div>
                  {items.map(m => (
                    <div key={m.id} className="flex items-center justify-between px-5 py-4 transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 flex-shrink-0" style={{ color: "#5E9BFF" }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
                            {m.descricao || label}
                            {m.subtipo && <span className="ml-2 text-xs" style={{ color: "#6B7FA3" }}>{m.subtipo}</span>}
                          </p>
                          {m.estado_municipio && (
                            <p className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>📍 {m.estado_municipio}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <a href={m.arquivo_url} target="_blank" rel="noreferrer"
                          className="text-xs font-medium" style={{ color: "#5E9BFF", fontFamily: "'Rethink Sans', sans-serif" }}>Ver arquivo</a>
                        <button onClick={() => { setEditando(m); setModalOpen(true); }}
                          className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#5E9BFF"}
                          onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                          <Upload className="w-4 h-4" />
                        </button>
                        <button onClick={() => deletar(m.id)}
                          className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                          onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <ModeloModal modelo={editando} onClose={() => setModalOpen(false)} onSave={() => { setModalOpen(false); carregar(); }} />
      )}
    </div>
  );
}