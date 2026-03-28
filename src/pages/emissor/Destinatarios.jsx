import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Search, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function DestModal({ dest, empresaId, onClose, onSave }) {
  const [form, setForm] = useState(dest || { cnpj: "", nome: "", email: "", telefone: "", municipio: "", uf: "", cep: "", logradouro: "", numero: "", bairro: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (dest?.id) await base44.entities.Destinatario.update(dest.id, form);
    else await base44.entities.Destinatario.create({ ...form, empresa_id: empresaId });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{dest ? "Editar Destinatário" : "Novo Destinatário"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Razão Social / Nome *</label>
            <input required className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              value={form.nome} onChange={e => set("nome", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">CNPJ / CPF *</label>
              <input required className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.cnpj} onChange={e => set("cnpj", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">I.E.</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.ie || ""} onChange={e => set("ie", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <input type="email" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Telefone</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.telefone} onChange={e => set("telefone", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Município</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.municipio} onChange={e => set("municipio", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">UF</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.uf} onChange={e => set("uf", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">CEP</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.cep} onChange={e => set("cep", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Bairro</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.bairro} onChange={e => set("bairro", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">Logradouro</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.logradouro} onChange={e => set("logradouro", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: "#0B63D4" }}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : "Salvar"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Destinatarios() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [destinatarios, setDestinatarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    try {
      const c = localStorage.getItem("emissor_current_client");
      if (!c) { navigate("/emissor/painel"); return; }
      const parsed = JSON.parse(c);
      setClient(parsed);
      carregar(parsed.id);
    } catch { navigate("/emissor/painel"); }
  }, []);

  const carregar = async (id) => {
    setLoading(true);
    const data = await base44.entities.Destinatario.filter({ empresa_id: id || client?.id });
    setDestinatarios(data.sort((a, b) => a.nome?.localeCompare(b.nome)));
    setLoading(false);
  };

  const deletar = async (id) => {
    if (!confirm("Excluir destinatário?")) return;
    await base44.entities.Destinatario.delete(id);
    carregar(client?.id);
  };

  const filtrados = destinatarios.filter(d =>
    d.nome?.toLowerCase().includes(search.toLowerCase()) || d.cnpj?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Destinatários</h1>
          <p className="text-gray-500 text-sm">{client?.razao_social} · {destinatarios.length} cadastrado(s)</p>
        </div>
        <button onClick={() => { setEditando(null); setModalOpen(true); }}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"
          style={{ backgroundColor: "#0B63D4" }}>
          <Plus className="w-4 h-4" /> Novo Destinatário
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] shadow-sm"
          placeholder="Buscar por nome ou CNPJ..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{destinatarios.length === 0 ? "Nenhum destinatário cadastrado." : "Nenhum resultado."}</p>
            <button onClick={() => { setEditando(null); setModalOpen(true); }} className="mt-3 text-sm font-medium hover:underline" style={{ color: "#0B63D4" }}>
              + Adicionar destinatário
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <AnimatePresence>
              {filtrados.map(d => (
                <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ backgroundColor: "#0B63D4" }}>
                      {d.nome?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{d.nome}</p>
                      <p className="text-xs text-gray-400">{d.cnpj} {d.municipio && `· ${d.municipio}/${d.uf}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
                    <button onClick={() => { setEditando(d); setModalOpen(true); }} className="p-2 text-gray-400 hover:text-[#0B63D4] rounded-lg hover:bg-blue-50">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deletar(d.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {modalOpen && (
        <DestModal dest={editando} empresaId={client?.id} onClose={() => setModalOpen(false)} onSave={() => { setModalOpen(false); carregar(client?.id); }} />
      )}
    </div>
  );
}