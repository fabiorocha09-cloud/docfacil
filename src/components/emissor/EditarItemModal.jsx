import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const fmt = v => Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

export default function EditarItemModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || {
    descricao: "", ncm: "", cfop: "5102", unidade: "UN",
    quantidade: 1, valor_unitario: 0,
    aliquota_icms: 0, aliquota_pis: 0.65, aliquota_cofins: 3,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const total = Number(form.quantidade) * Number(form.valor_unitario);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const dados = {
      ...form,
      valor_total: total,
      valor_icms: total * Number(form.aliquota_icms) / 100,
      valor_pis: total * Number(form.aliquota_pis) / 100,
      valor_cofins: total * Number(form.aliquota_cofins) / 100,
    };
    await onSave(dados);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{item ? "Editar Item" : "Novo Item"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Descrição *</label>
            <input required className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              value={form.descricao} onChange={e => set("descricao", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">NCM</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                placeholder="00000000" value={form.ncm} onChange={e => set("ncm", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">CFOP</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.cfop} onChange={e => set("cfop", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Unidade</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.unidade} onChange={e => set("unidade", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Qtd</label>
              <input type="number" min="0.001" step="0.001" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.quantidade} onChange={e => set("quantidade", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Valor Unit.</label>
              <input type="number" min="0" step="0.01" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.valor_unitario} onChange={e => set("valor_unitario", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Total</label>
              <div className="mt-1 px-3 py-2 rounded-xl text-sm font-bold bg-blue-100 text-blue-700">R$ {fmt(total)}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["aliquota_icms","ICMS %"],["aliquota_pis","PIS %"],["aliquota_cofins","COFINS %"]].map(([k, l]) => (
              <div key={k}>
                <label className="text-xs font-medium text-gray-700">{l}</label>
                <input type="number" min="0" step="0.01" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  value={form[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: "#0B63D4" }}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : "Salvar"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}