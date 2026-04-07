import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Phone, Building2, Pencil, Trash2, X, Loader2, MessageCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

function ContatoModal({ contato, empresas, onClose, onSave }) {
  const { toast } = useToast();
  const [form, setForm] = useState(contato || { nome: "", telefone: "", empresa_id: "", empresa_nome: "", empresa_cnpj: "", ativo: true, observacoes: "" });
  const [saving, setSaving] = useState(false);

  const handleEmpresa = (id) => {
    const emp = empresas.find(e => e.id === id);
    setForm(f => ({ ...f, empresa_id: id, empresa_nome: emp?.nome || "", empresa_cnpj: emp?.cnpj || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (contato?.id) {
      await base44.entities.Contato.update(contato.id, form);
    } else {
      await base44.entities.Contato.create(form);
    }
    toast({ title: "✅ Contato salvo com sucesso!" });
    onSave();
  };

  const inputCls = "w-full rounded-xl px-3 py-2 text-sm focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {contato ? "Editar Contato" : "Novo Contato"}
          </h2>
          <button onClick={onClose} style={{ color: "#6B7FA3" }}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#A0B1D4" }}>Nome *</label>
            <input required className={inputCls} style={inputStyle}
              value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Nome do contato" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#A0B1D4" }}>Telefone / WhatsApp *</label>
            <input required className={inputCls} style={inputStyle}
              value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
              placeholder="+5591984482625" />
            <p className="text-xs mt-1" style={{ color: "#6B7FA3" }}>Inclua DDI e DDD. Ex: +5591984482625</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#A0B1D4" }}>Empresa vinculada *</label>
            <select required className={inputCls} style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }}
              value={form.empresa_id} onChange={e => handleEmpresa(e.target.value)}>
              <option value="" style={{ background: "#0A0D14" }}>Selecionar empresa...</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id} style={{ background: "#0A0D14" }}>
                  {emp.nome} — {emp.cnpj}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#A0B1D4" }}>Observações</label>
            <textarea rows={2} className={inputCls} style={{ ...inputStyle, resize: "none" }}
              value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              placeholder="Cargo, departamento, etc." />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button"
              onClick={() => setForm(f => ({ ...f, ativo: !f.ativo }))}
              className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
              style={{ background: form.ativo ? "#3A8DFF" : "rgba(255,255,255,0.15)" }}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.ativo ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm" style={{ color: "#A0B1D4" }}>Contato ativo</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 text-sm font-medium py-2 rounded-xl"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContatosWhatsApp() {
  const [contatos, setContatos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const { toast } = useToast();

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    setLoading(true);
    const [c, e] = await Promise.all([
      base44.entities.Contato.list("-created_date", 500),
      base44.entities.Empresa.list(),
    ]);
    setContatos(c);
    setEmpresas(e.filter(emp => !emp.excluida));
    setLoading(false);
  };

  const deletar = async (id) => {
    if (!confirm("Remover este contato?")) return;
    await base44.entities.Contato.delete(id);
    toast({ title: "🗑️ Contato removido." });
    carregar();
  };

  const filtrados = contatos.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone?.includes(search) ||
    c.empresa_nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.empresa_cnpj?.includes(search)
  );

  const whatsappURL = base44.agents.getWhatsAppConnectURL("whatsapp_docfacil");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>
            Contatos WhatsApp
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>
            {contatos.length} contato(s) vinculado(s) a empresas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a href={whatsappURL} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366" }}>
            <MessageCircle className="w-4 h-4" />
            Conectar WhatsApp
          </a>
          <button onClick={() => { setEditando(null); setModalOpen(true); }}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
            <Plus className="w-4 h-4" /> Novo Contato
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.15)" }}>
        <MessageCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#25d366" }} />
        <div className="text-sm" style={{ color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>
          <p className="font-semibold mb-1" style={{ color: "#4ade80", fontFamily: "'Manrope', sans-serif" }}>Como funciona</p>
          <p>Cadastre os contatos e vincule-os às empresas pelo número de WhatsApp. Quando o cliente mandar uma mensagem, o agente identifica automaticamente a empresa pelo número e responde com certidões e documentos solicitados.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7FA3" }} />
        <input className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }}
          placeholder="Buscar por nome, telefone ou empresa..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={cardStyle}>
          <Phone className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#A0B1D4" }} />
          <p style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Nenhum contato cadastrado ainda.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Outfit', sans-serif" }}>{filtrados.length} resultado(s)</span>
          </div>
          <div>
            {filtrados.map(contato => (
              <div key={contato.id}
                className="flex items-center justify-between px-5 py-4 transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: contato.ativo ? "rgba(37,211,102,0.12)" : "rgba(255,255,255,0.05)" }}>
                    <Phone className="w-5 h-5" style={{ color: contato.ativo ? "#25d366" : "#6B7FA3" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{contato.nome}</p>
                      {!contato.ativo && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "#6B7FA3" }}>Inativo</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs mt-0.5 flex-wrap" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" style={{ color: "#25d366" }} />
                        {contato.telefone}
                      </span>
                      {contato.empresa_nome && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {contato.empresa_nome}
                        </span>
                      )}
                      {contato.empresa_cnpj && <span>{contato.empresa_cnpj}</span>}
                    </div>
                    {contato.observacoes && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#4B5A7A", fontFamily: "'Rethink Sans', sans-serif" }}>{contato.observacoes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
                  <button onClick={() => { setEditando(contato); setModalOpen(true); }}
                    className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#5E9BFF"}
                    onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deletar(contato.id)}
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
      )}

      {modalOpen && (
        <ContatoModal
          contato={editando}
          empresas={empresas}
          onClose={() => setModalOpen(false)}
          onSave={() => { setModalOpen(false); carregar(); }}
        />
      )}
    </div>
  );
}