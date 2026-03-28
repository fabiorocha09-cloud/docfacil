import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, X, Loader2, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CFOP_OPTIONS = [
  "1101","1102","1201","1202","1301","1302","1401","1403","1500","1501",
  "2101","2102","2201","2202","2301","2302","2401","2403","2500","2501",
  "5101","5102","5103","5104","5201","5202","5301","5302","5401","5402","5501","5502",
  "6101","6102","6103","6104","6201","6202","6301","6302","6401","6402","6501","6502",
];

function NaturezaModal({ item, empresaId, onClose, onSave }) {
  const [form, setForm] = useState({
    nome: item?.nome || "",
    finalidade: item?.finalidade || "Normal",
    cfop_estadual: item?.cfop_estadual || "5102",
    cfop_interestadual: item?.cfop_interestadual || "6102",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, empresa_id: empresaId, ativo: true };
    if (item?.id) await base44.entities.NaturezaTributaria.update(item.id, data);
    else await base44.entities.NaturezaTributaria.create(data);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{item ? "Editar Natureza" : "Cadastrar Natureza"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nome da Natureza *</label>
            <input required className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              placeholder="Ex: Venda" value={form.nome} onChange={e => set("nome", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Finalidade</label>
            <select className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              value={form.finalidade} onChange={e => set("finalidade", e.target.value)}>
              <option value="Normal">Normal</option>
              <option value="Devolução">Devolução</option>
              <option value="Complementar">Complementar</option>
              <option value="Ajuste">Ajuste</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">CFOP Estadual *</label>
              <select required className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.cfop_estadual} onChange={e => set("cfop_estadual", e.target.value)}>
                {CFOP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">CFOP Interestadual</label>
              <select className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.cfop_interestadual} onChange={e => set("cfop_interestadual", e.target.value)}>
                {CFOP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: "#0B63D4" }}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : "Adicionar"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function NaturezasTributarias() {
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
    const data = await base44.entities.NaturezaTributaria.filter({ empresa_id: id || client?.id });
    setItens(data);
    setLoading(false);
  };

  const deletar = async (id) => {
    if (!confirm("Excluir esta natureza tributária?")) return;
    await base44.entities.NaturezaTributaria.delete(id);
    carregar(client?.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Naturezas Tributárias</h1>
          <p className="text-gray-500 text-sm">{client?.razao_social} · {itens.length} natureza(s)</p>
        </div>
        <button onClick={() => { setEditando(null); setModalOpen(true); }}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"
          style={{ backgroundColor: "#0B63D4" }}>
          <Plus className="w-4 h-4" /> Nova Natureza
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : itens.length === 0 ? (
          <div className="p-16 text-center">
            <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma natureza tributária cadastrada.</p>
            <p className="text-xs text-gray-400 mt-1">Ex: Venda, Devolução de compra, Devolução de venda</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome da Natureza</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Finalidade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CFOP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {itens.map(item => (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">{item.nome}</td>
                    <td className="px-4 py-4 text-gray-600">{item.finalidade}</td>
                    <td className="px-4 py-4 text-gray-500 font-mono text-xs">{item.cfop_estadual} / {item.cfop_interestadual}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${item.ativo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {item.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
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
        <NaturezaModal item={editando} empresaId={client?.id} onClose={() => setModalOpen(false)} onSave={() => { setModalOpen(false); carregar(client?.id); }} />
      )}
    </div>
  );
}