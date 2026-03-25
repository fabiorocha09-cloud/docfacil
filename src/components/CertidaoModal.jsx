import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const TIPOS_LABEL = {
  federal: "Federal",
  estadual: "Estadual",
  municipal: "Municipal",
  fgts: "FGTS",
  trabalhista: "Trabalhista",
  alvara_bombeiros: "Alvará - Bombeiros",
  alvara_vigilancia_sanitaria: "Alvará - Vigilância Sanitária",
  alvara_funcionamento: "Alvará - Funcionamento",
  alvara_meio_ambiente: "Alvará - Meio Ambiente",
};
const TIPOS_CONSOLIDADOS_MATRIZ = ["federal", "fgts", "trabalhista"];
const subtipos = {
  federal: ["Receita Federal", "PGFN", "Conjunta RFB/PGFN"],
  estadual: ["SEFAZ-PA", "SEFAZ-SP", "SEFAZ-RJ", "SEFAZ-MG", "SEFAZ-RS", "Outro"],
  municipal: ["ISS", "TFE", "TFA", "Outro"],
  fgts: ["CRF - Caixa"],
  trabalhista: ["CNDT - TST"],
};

export default function CertidaoModal({ certidao, empresas, onClose, onSave }) {
  const { toast } = useToast();
  const [form, setForm] = useState(certidao || {
    empresa_id: "", empresa_nome: "", empresa_cnpj: "", tipo: "federal", subtipo: "",
    status: "pendente", data_emissao: "", data_vencimento: "", arquivo_url: "", observacoes: "",
    prazo_esperado: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleEmpresa = (id) => {
    const emp = empresas.find(e => e.id === id);
    setForm({ ...form, empresa_id: id, empresa_nome: emp?.nome || "", empresa_cnpj: emp?.cnpj || "" });
  };

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
    if (certidao?.id) {
      await base44.entities.Certidao.update(certidao.id, form);
    } else {
      await base44.entities.Certidao.create(form);
    }
    toast({ title: "✅ Gravação realizada com sucesso!", description: certidao?.id ? "Certidão atualizada." : "Nova certidão criada." });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{certidao ? "Editar Certidão" : "Nova Certidão"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
            <select required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.empresa_id} onChange={e => handleEmpresa(e.target.value)}>
              <option value="">Selecionar empresa...</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nome} — {e.cnpj}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value, subtipo: "" })}>
                {Object.entries(TIPOS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="pendente">Pendente</option>
              <option value="processando">Processando</option>
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
              <option value="erro">Erro</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Emissão</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.data_emissao} onChange={e => setForm({ ...form, data_emissao: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.data_vencimento} onChange={e => setForm({ ...form, data_vencimento: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF da Certidão</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg transition-colors">
                <Upload className="w-4 h-4" />
                {uploading ? "Enviando..." : "Fazer Upload"}
                <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
              {form.arquivo_url && (
                <a href={form.arquivo_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Ver PDF</a>
              )}
            </div>
          </div>
          {form.status === "pendente" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prazo Esperado <span className="text-gray-400 font-normal">(quando deve retornar)</span></label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.prazo_esperado || ""} onChange={e => setForm({ ...form, prazo_esperado: e.target.value })} />
            </div>
          )}
          {TIPOS_CONSOLIDADOS_MATRIZ.includes(form.tipo) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              ℹ️ Este tipo de certidão pode ser consolidado da <strong>matriz</strong> para empresas filiais.
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving || uploading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}