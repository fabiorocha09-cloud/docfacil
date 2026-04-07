import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Phone, Building2, Pencil, Trash2, X, Loader2, MessageCircle, CheckSquare, Square } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

function ContatoModal({ contato, empresas, onClose, onSave }) {
  const { toast } = useToast();
  const [form, setForm] = useState(() => ({
    nome: contato?.nome || "",
    telefone: contato?.telefone || "",
    ativo: contato?.ativo !== false,
    observacoes: contato?.observacoes || "",
    empresas: contato?.empresas || [],
  }));
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const toggleEmpresa = (emp) => {
    setForm(f => {
      const exists = f.empresas.some(e => e.id === emp.id);
      if (exists) {
        return { ...f, empresas: f.empresas.filter(e => e.id !== emp.id) };
      } else {
        return { ...f, empresas: [...f.empresas, { id: emp.id, nome: emp.nome, cnpj: emp.cnpj }] };
      }
    });
  };

  const isSelected = (empId) => form.empresas.some(e => e.id === empId);

  const empresasFiltradas = empresas.filter(e =>
    e.nome?.toLowerCase().includes(search.toLowerCase()) ||
    e.cnpj?.includes(search)
  );

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
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {contato ? "Editar Contato" : "Novo Contato"}
          </h2>
          <button onClick={onClose} style={{ color: "#6B7FA3" }}><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
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

            {/* Empresas vinculadas - multi-select */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#A0B1D4" }}>
                Empresas vinculadas
                {form.empresas.length > 0 && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(58,141,255,0.15)", color: "#5E9BFF" }}>
                    {form.empresas.length} selecionada(s)
                  </span>
                )}
              </label>

              {/* Chips das selecionadas */}
              {form.empresas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.empresas.map(emp => (
                    <span key={emp.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(58,141,255,0.15)", border: "1px solid rgba(58,141,255,0.3)", color: "#5E9BFF" }}>
                      {emp.nome}
                      <button type="button" onClick={() => toggleEmpresa(emp)} className="hover:opacity-70">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Busca */}
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#6B7FA3" }} />
                <input className="w-full pl-8 pr-3 py-2 rounded-xl text-xs focus:outline-none"
                  style={inputStyle}
                  placeholder="Buscar empresa..."
                  value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>

              {/* Lista de empresas */}
              <div className="rounded-xl overflow-hidden max-h-40 overflow-y-auto" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                {empresasFiltradas.length === 0 ? (
                  <div className="p-3 text-xs text-center" style={{ color: "#6B7FA3" }}>Nenhuma empresa encontrada</div>
                ) : (
                  empresasFiltradas.map(emp => {
                    const sel = isSelected(emp.id);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => toggleEmpresa(emp)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                        style={{
                          background: sel ? "rgba(58,141,255,0.1)" : "transparent",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                        onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                      >
                        {sel
                          ? <CheckSquare className="w-4 h-4 flex-shrink-0" style={{ color: "#5E9BFF" }} />
                          : <Square className="w-4 h-4 flex-shrink-0" style={{ color: "#6B7FA3" }} />
                        }
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate" style={{ color: sel ? "#fff" : "#A0B1D4", fontFamily: "'Manrope', sans-serif" }}>{emp.nome}</p>
                          <p className="text-xs" style={{ color: "#6B7FA3" }}>{emp.cnpj}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
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
          </div>

          <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
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
    c.empresas?.some(e =>
      e.nome?.toLowerCase().includes(search.toLowerCase()) ||
      e.cnpj?.includes(search)
    )
  );

  const whatsappURL = base44.agents.getWhatsAppConnectURL("whatsapp_docfacil");

  const waLink = (telefone) => {
    const numero = telefone?.replace(/\D/g, "");
    return `https://wa.me/${numero}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>
            Contatos WhatsApp
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>
            {contatos.length} contato(s) cadastrado(s)
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
          <p>Cadastre contatos e vincule múltiplas empresas ao mesmo número de WhatsApp. O agente identifica o contato pelo número, lista as empresas vinculadas e pergunta sobre qual o cliente deseja falar.</p>
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
            {filtrados.map(contato => {
              const empresasVinculadas = contato.empresas || [];
              return (
                <div key={contato.id}
                  className="px-5 py-4 transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: contato.ativo ? "rgba(37,211,102,0.12)" : "rgba(255,255,255,0.05)" }}>
                        <Phone className="w-5 h-5" style={{ color: contato.ativo ? "#25d366" : "#6B7FA3" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{contato.nome}</p>
                          {!contato.ativo && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "#6B7FA3" }}>Inativo</span>
                          )}
                          {empresasVinculadas.length > 1 && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(58,141,255,0.12)", color: "#5E9BFF", border: "1px solid rgba(58,141,255,0.25)" }}>
                              {empresasVinculadas.length} empresas
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>
                          <MessageCircle className="w-3 h-3" style={{ color: "#25d366" }} />
                          {contato.telefone}
                        </div>
                        {/* Empresas vinculadas */}
                        {empresasVinculadas.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {empresasVinculadas.map(emp => (
                              <span key={emp.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#A0B1D4" }}>
                                <Building2 className="w-3 h-3" style={{ color: "#6B7FA3" }} />
                                <span className="font-medium" style={{ color: "#fff" }}>{emp.nome}</span>
                                <span style={{ color: "#6B7FA3" }}>— {emp.cnpj}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs" style={{ color: "#6B7FA3" }}>Nenhuma empresa vinculada</p>
                        )}
                        {contato.observacoes && (
                          <p className="text-xs mt-1.5 truncate" style={{ color: "#4B5A7A", fontFamily: "'Rethink Sans', sans-serif" }}>{contato.observacoes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a href={waLink(contato.telefone)} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.25)", color: "#25d366" }}
                        title="Abrir conversa no WhatsApp">
                        <MessageCircle className="w-3.5 h-3.5" />
                        Conversar
                      </a>
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
                </div>
              );
            })}
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