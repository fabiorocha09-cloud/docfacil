import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

const tipos = ["federal", "estadual", "municipal", "fgts", "trabalhista"];
const subtipos = {
  federal: ["Receita Federal", "PGFN", "Conjunta RFB/PGFN"],
  estadual: ["SEFAZ-PA", "SEFAZ-SP", "SEFAZ-RJ", "SEFAZ-MG", "SEFAZ-RS", "Outro"],
  municipal: ["ISS", "TFE", "TFA", "Outro"],
  fgts: ["CRF - Caixa"],
  trabalhista: ["CNDT - TST"],
};

const urlSugeridas = {
  fgts: "https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf",
  trabalhista: "https://cndt-certidao.tst.jus.br/inicio.faces",
};

export default function PortalModal({ portal, empresas, onClose, onSave }) {
  const [form, setForm] = useState(portal || {
    empresa_id: "", empresa_nome: "", tipo: "federal", subtipo: "",
    url_portal: "", tem_captcha: false, servico_captcha: "nenhum",
    chave_captcha: "", periodicidade: "mensal", dia_execucao: "", ativo: true
  });
  const [saving, setSaving] = useState(false);

  const handleEmpresa = (id) => {
    const emp = empresas.find(e => e.id === id);
    setForm({ ...form, empresa_id: id, empresa_nome: emp?.nome || "" });
  };

  const handleTipo = (tipo) => {
    const url = urlSugeridas[tipo] || "";
    setForm({ ...form, tipo, subtipo: "", url_portal: url, tem_captcha: tipo === "trabalhista" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (portal?.id) {
      await base44.entities.PortalConfig.update(portal.id, form);
    } else {
      await base44.entities.PortalConfig.create(form);
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{portal ? "Editar Portal" : "Novo Portal"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
            <select required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.empresa_id} onChange={e => handleEmpresa(e.target.value)}>
              <option value="">Selecionar empresa...</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.tipo} onChange={e => handleTipo(e.target.value)}>
                {tipos.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtipo</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.subtipo} onChange={e => setForm({ ...form, subtipo: e.target.value })}>
                <option value="">Selecionar...</option>
                {(subtipos[form.tipo] || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL do Portal *</label>
            <input required type="url" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.url_portal} onChange={e => setForm({ ...form, url_portal: e.target.value })} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.tem_captcha} onChange={e => setForm({ ...form, tem_captcha: e.target.checked, servico_captcha: e.target.checked ? "2captcha" : "nenhum" })} />
              <span className="text-sm font-medium text-gray-700">Portal possui CAPTCHA</span>
            </label>
          </div>
          {form.tem_captcha && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serviço Anti-Captcha</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.servico_captcha} onChange={e => setForm({ ...form, servico_captcha: e.target.value })}>
                  <option value="2captcha">2Captcha</option>
                  <option value="anticaptcha">Anti-Captcha</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chave API</label>
                <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.chave_captcha} onChange={e => setForm({ ...form, chave_captcha: e.target.value })} placeholder="Sua chave API" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periodicidade</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.periodicidade} onChange={e => setForm({ ...form, periodicidade: e.target.value })}>
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal">Mensal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Execução</label>
              <input type="number" min="1" max="31" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.dia_execucao} onChange={e => setForm({ ...form, dia_execucao: Number(e.target.value) })} placeholder="Ex: 10" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.checked })} />
              <span className="text-sm font-medium text-gray-700">Robô ativo</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}