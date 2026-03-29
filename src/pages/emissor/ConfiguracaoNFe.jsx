import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Settings, Save, Loader2, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function ConfiguracaoNFe() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    nfe_serie: "1",
    nfe_ultimo_numero: 0,
    nfe_ambiente: "homologacao",
    nfe_io_company_id: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    try {
      const c = localStorage.getItem("emissor_current_client");
      if (!c) { navigate("/emissor/painel"); return; }
      const parsed = JSON.parse(c);
      setClient(parsed);
      base44.entities.EmpresaCliente.filter({ id: parsed.id }).then(res => {
        if (res[0]) {
          const emp = res[0];
          setEmpresa(emp);
          setForm({
            nfe_serie: emp.nfe_serie || "1",
            nfe_ultimo_numero: emp.nfe_ultimo_numero || 0,
            nfe_ambiente: emp.nfe_ambiente || "homologacao",
            nfe_io_company_id: emp.nfe_io_company_id || "",
          });
        }
        setLoading(false);
      });
    } catch { navigate("/emissor/painel"); }
  }, []);

  const handleSave = async () => {
    if (!empresa) return;
    setSaving(true);
    await base44.entities.EmpresaCliente.update(empresa.id, form);
    // Atualiza o localStorage com os novos dados
    const updated = { ...client, nfe_serie: form.nfe_serie, nfe_ultimo_numero: form.nfe_ultimo_numero, ambiente: form.nfe_ambiente, nfe_io_company_id: form.nfe_io_company_id };
    localStorage.setItem("emissor_current_client", JSON.stringify(updated));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações da NF-e</h1>
        <p className="text-gray-500 text-sm">{client?.razao_social}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">

        {/* Numeração */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#0B63D4]" /> Numeração e Série
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Controle a série e o último número emitido para evitar duplicidades.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Série *</label>
              <input
                type="text"
                maxLength={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                placeholder="Ex: 1"
                value={form.nfe_serie}
                onChange={e => set("nfe_serie", e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Normalmente "1" para NF-e</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Último Número Emitido</label>
              <input
                type="number"
                min={0}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                placeholder="0"
                value={form.nfe_ultimo_numero}
                onChange={e => set("nfe_ultimo_numero", parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-400 mt-1">Próxima nota será {(parseInt(form.nfe_ultimo_numero) || 0) + 1}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Ambiente de Emissão</h2>
          <div className="flex gap-3 mt-3">
            <label className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
              form.nfe_ambiente === "homologacao" ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:bg-gray-50"
            }`}>
              <input type="radio" name="ambiente" value="homologacao"
                checked={form.nfe_ambiente === "homologacao"}
                onChange={() => set("nfe_ambiente", "homologacao")}
                className="hidden" />
              <div>
                <p className="text-sm font-semibold text-amber-700">🧪 Homologação</p>
                <p className="text-xs text-gray-400">Notas de teste, sem valor fiscal</p>
              </div>
            </label>
            <label className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
              form.nfe_ambiente === "producao" ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"
            }`}>
              <input type="radio" name="ambiente" value="producao"
                checked={form.nfe_ambiente === "producao"}
                onChange={() => set("nfe_ambiente", "producao")}
                className="hidden" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">✅ Produção</p>
                <p className="text-xs text-gray-400">Notas reais com validade fiscal</p>
              </div>
            </label>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h2 className="text-base font-semibold text-gray-800 mb-1">NFE.io</h2>
          <div className="mt-3">
            <label className="text-sm font-semibold text-gray-700 block mb-1">Company ID no NFE.io *</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              placeholder="ID da empresa no painel NFE.io"
              value={form.nfe_io_company_id}
              onChange={e => set("nfe_io_company_id", e.target.value)}
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            O número da NF-e é controlado pela SEFAZ via NFE.io. O campo "Último Número Emitido" serve como referência local para evitar reenvios duplicados. Após cada transmissão bem-sucedida, o número é atualizado automaticamente.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
          style={{ backgroundColor: "#0B63D4" }}
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            : saved
            ? <><Save className="w-4 h-4" /> ✓ Configurações salvas!</>
            : <><Save className="w-4 h-4" /> Salvar Configurações</>
          }
        </button>
      </div>
    </div>
  );
}