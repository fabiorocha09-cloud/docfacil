import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, X, Loader2, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CFOP_OPTIONS = [
  "5101", "5102", "5103", "5104", "5201", "5202", "5301", "5302",
  "6101", "6102", "6103", "6104", "6201", "6202",
];

function TributacaoModal({ item, empresaId, onClose, onSave }) {
  const [nome, setNome] = useState(item?.nome || "");
  const [cfopEstadual, setCfopEstadual] = useState(item?.cfop_estadual || "5102");
  const [cfopInterestadual, setCfopInterestadual] = useState(item?.cfop_interestadual || "6102");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { nome, cfop_estadual: cfopEstadual, cfop_interestadual: cfopInterestadual, empresa_id: empresaId, ativo: true };
    if (item?.id) await base44.entities.RegraTributacao.update(item.id, data);
    else await base44.entities.RegraTributacao.create(data);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{item ? "Editar Tributação" : "Nova Tributação"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nome do Grupo de Tributação *</label>
            <input required className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              placeholder="Ex: Tributação Simples" value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">CFOP Estadual</label>
              <select className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={cfopEstadual} onChange={e => setCfopEstadual(e.target.value)}>
                {CFOP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">CFOP Interestadual</label>
              <select className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={cfopInterestadual} onChange={e => setCfopInterestadual(e.target.value)}>
                {CFOP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
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

export default function Tributacao() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const data = await base44.entities.RegraTributacao.filter({ empresa_id: id || client?.id });
    setItens(data);
    setLoading(false);
  };

  const deletar = async (id) => {
    if (!confirm("Excluir esta regra de tributação?")) return;
    await base44.entities.RegraTributacao.delete(id);
    carregar(client?.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tributação</h1>
          <p className="text-gray-500 text-sm">{client?.razao_social} · {itens.length} regra(s)</p>
        </div>
        <button onClick={() => { setEditando(null); setModalOpen(true); }}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"
          style={{ backgroundColor: "#0B63D4" }}>
          <Plus className="w-4 h-4" /> Nova Tributação
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : itens.length === 0 ? (
          <div className="p-16 text-center">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma regra de tributação cadastrada.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome da Regra</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CFOP Estadual</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CFOP Interestadual</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {itens.map(item => (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">{item.nome}</td>
                    <td className="px-4 py-4 text-gray-600">{item.cfop_estadual}</td>
                    <td className="px-4 py-4 text-gray-600">{item.cfop_interestadual}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setEditando(item); setModalOpen(true); }} className="p-2 text-gray-400 hover:text-[#0B63D4] rounded-lg hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deletar(item.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <TributacaoModal item={editando} empresaId={client?.id} onClose={() => setModalOpen(false)} onSave={() => { setModalOpen(false); carregar(client?.id); }} />
      )}
    </div>
  );
}