import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Plus, Trash2, CheckCircle2, Circle, Search, X, Loader2, Paperclip, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

export default function CentralRespostas() {
  const [respostas, setRespostas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [visualizando, setVisualizando] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      base44.entities.RespostaEmail.list("-created_date", 100),
      base44.entities.Empresa.list(),
    ]).then(([r, e]) => { setRespostas(r); setEmpresas(e); setLoading(false); });
  }, []);

  const marcarLida = async (resp) => {
    await base44.entities.RespostaEmail.update(resp.id, { lida: true });
    setRespostas(prev => prev.map(r => r.id === resp.id ? { ...r, lida: true } : r));
  };

  const deletar = async (id) => {
    if (!confirm("Remover esta resposta?")) return;
    await base44.entities.RespostaEmail.delete(id);
    toast({ title: "🗑️ Resposta removida." });
    setRespostas(prev => prev.filter(r => r.id !== id));
  };

  const naoLidas = respostas.filter(r => !r.lida).length;
  const filtradas = respostas.filter(r =>
    r.empresa_nome?.toLowerCase().includes(search.toLowerCase()) ||
    r.de?.toLowerCase().includes(search.toLowerCase()) ||
    r.assunto_original?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>
            Central de Respostas
            {naoLidas > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{naoLidas}</span>
            )}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Respostas recebidas aos e-mails de solicitação de certidões</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
          style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
          <Plus className="w-4 h-4" /> Registrar Resposta
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7FA3" }} />
        <input className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }}
          placeholder="Buscar por empresa, remetente ou assunto..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}</div>
      ) : filtradas.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={cardStyle}>
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#A0B1D4" }} />
          <p style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Nenhuma resposta registrada.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div>
            {filtradas.map(resp => (
              <div key={resp.id}
                className="flex items-center justify-between px-5 py-4 cursor-pointer transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: !resp.lida ? "rgba(58,141,255,0.05)" : "transparent" }}
                onClick={() => { setVisualizando(resp); if (!resp.lida) marcarLida(resp); }}
                onMouseEnter={e => { if (resp.lida) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={e => { if (resp.lida) e.currentTarget.style.background = "transparent"; }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0" style={{ color: !resp.lida ? "#5E9BFF" : "#6B7FA3" }}>
                    {resp.lida ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: !resp.lida ? "#fff" : "#A0B1D4", fontFamily: "'Manrope', sans-serif" }}>
                        {resp.empresa_nome}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "#A0B1D4", fontFamily: "'Outfit', sans-serif" }}>
                        {resp.tipo === "tj_pa" ? "TJ-PA" : "Outro"}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>
                      De: {resp.de} · {resp.assunto_original && `"${resp.assunto_original}"`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <span className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Outfit', sans-serif" }}>
                    {resp.data_recebimento ? new Date(resp.data_recebimento).toLocaleDateString("pt-BR") : new Date(resp.created_date).toLocaleDateString("pt-BR")}
                  </span>
                  <button onClick={e => { e.stopPropagation(); deletar(resp.id); }}
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

      {visualizando && <VisualizarRespostaModal resposta={visualizando} onClose={() => setVisualizando(null)} />}
      {modalOpen && (
        <RegistrarRespostaModal empresas={empresas} onClose={() => setModalOpen(false)}
          onSave={(nova) => { setRespostas(prev => [nova, ...prev]); setModalOpen(false); }} />
      )}
    </div>
  );
}

function VisualizarRespostaModal({ resposta, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div>
            <h2 className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>Resposta Recebida</h2>
            <p className="text-xs mt-0.5" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{resposta.empresa_nome}</p>
          </div>
          <button onClick={onClose} style={{ color: "#6B7FA3" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto">
          <div className="rounded-xl p-3 space-y-1 text-xs" style={{ background: "rgba(255,255,255,0.04)", color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>
            <p><strong style={{ color: "#fff" }}>De:</strong> {resposta.de}</p>
            <p><strong style={{ color: "#fff" }}>Para:</strong> {resposta.para}</p>
            {resposta.assunto_original && <p><strong style={{ color: "#fff" }}>Assunto:</strong> {resposta.assunto_original}</p>}
            {resposta.data_recebimento && <p><strong style={{ color: "#fff" }}>Recebido em:</strong> {new Date(resposta.data_recebimento).toLocaleDateString("pt-BR")}</p>}
          </div>
          <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>{resposta.corpo}</p>
          </div>
          {resposta.anexos_urls && resposta.anexos_urls.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1.5" style={{ color: "#A0B1D4", fontFamily: "'Manrope', sans-serif" }}>
                <Paperclip className="w-4 h-4" /> Anexos ({resposta.anexos_urls.length})
              </p>
              <div className="space-y-2">
                {resposta.anexos_urls.map((url, index) => {
                  const nome = decodeURIComponent(url.split('/').pop().split('?')[0]) || `Anexo ${index + 1}`;
                  return (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
                      style={{ background: "rgba(58,141,255,0.08)", border: "1px solid rgba(58,141,255,0.2)", color: "#5E9BFF" }}>
                      <Download className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{nome}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          {resposta.observacoes && (
            <div className="rounded-xl p-3" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
              <p className="text-xs" style={{ color: "#fcd34d", fontFamily: "'Rethink Sans', sans-serif" }}><strong>Observações:</strong> {resposta.observacoes}</p>
            </div>
          )}
        </div>
        <div className="p-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="w-full text-sm font-medium py-2 rounded-xl transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function RegistrarRespostaModal({ empresas, onClose, onSave }) {
  const [form, setForm] = useState({
    empresa_id: "", empresa_nome: "", assunto_original: "", de: "", para: "",
    corpo: "", data_recebimento: new Date().toISOString().slice(0, 16), tipo: "tj_pa", observacoes: ""
  });
  const [saving, setSaving] = useState(false);

  const handleEmpresa = (id) => {
    const emp = empresas.find(e => e.id === id);
    setForm({ ...form, empresa_id: id, empresa_nome: emp?.nome || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const nova = await base44.entities.RespostaEmail.create({
      ...form, data_recebimento: form.data_recebimento ? new Date(form.data_recebimento).toISOString() : new Date().toISOString(), lida: false,
    });
    onSave(nova);
  };

  const inputCls = "w-full rounded-xl px-3 py-2 text-sm focus:outline-none";
  const inputSt = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };
  const labelSt = { color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>Registrar Resposta Recebida</h2>
          <button onClick={onClose} style={{ color: "#6B7FA3" }}><X className="w-5 h-5" /></button>
        </div>
        <form id="form-resposta" onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={labelSt}>Empresa *</label>
              <select required className={inputCls} style={{ ...inputSt, fontFamily: "'Rethink Sans', sans-serif" }} value={form.empresa_id} onChange={e => handleEmpresa(e.target.value)}>
                <option value="" style={{ background: "#0A0D14" }}>Selecionar...</option>
                {empresas.map(e => <option key={e.id} value={e.id} style={{ background: "#0A0D14" }}>{e.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={labelSt}>Tipo</label>
              <select className={inputCls} style={{ ...inputSt, fontFamily: "'Rethink Sans', sans-serif" }} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                <option value="tj_pa" style={{ background: "#0A0D14" }}>TJ-PA</option>
                <option value="outro" style={{ background: "#0A0D14" }}>Outro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={labelSt}>De (remetente) *</label>
              <input required className={inputCls} style={inputSt} value={form.de} onChange={e => setForm({ ...form, de: e.target.value })} placeholder="cartorio@tj.pa.gov.br" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={labelSt}>Para</label>
              <input className={inputCls} style={inputSt} value={form.para} onChange={e => setForm({ ...form, para: e.target.value })} placeholder="fiscal@escritorio.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={labelSt}>Assunto original</label>
            <input className={inputCls} style={inputSt} value={form.assunto_original} onChange={e => setForm({ ...form, assunto_original: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={labelSt}>Data de recebimento</label>
            <input type="datetime-local" className={inputCls} style={inputSt} value={form.data_recebimento} onChange={e => setForm({ ...form, data_recebimento: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={labelSt}>Corpo da resposta *</label>
            <textarea required rows={5} className={inputCls} style={{ ...inputSt, resize: "none" }} value={form.corpo} onChange={e => setForm({ ...form, corpo: e.target.value })} placeholder="Cole aqui o conteúdo da resposta recebida..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={labelSt}>Observações internas</label>
            <textarea rows={2} className={inputCls} style={{ ...inputSt, resize: "none" }} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
          </div>
        </form>
        <div className="flex gap-3 p-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button type="button" onClick={onClose} className="flex-1 text-sm font-medium py-2 rounded-xl"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}>Cancelar</button>
          <button type="submit" form="form-resposta" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar Resposta"}
          </button>
        </div>
      </div>
    </div>
  );
}