import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Building2, MapPin, Settings, Save, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

const TABS = [
  { id: "basico", label: "Dados Básicos", icon: Building2 },
  { id: "endereco", label: "Endereço", icon: MapPin },
  { id: "nfeio", label: "NFE.io", icon: Settings },
];

export default function EditarEmpresa() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aba, setAba] = useState("basico");
  const [testando, setTestando] = useState(false);
  const [testeResult, setTesteResult] = useState(null);

  const [form, setForm] = useState({
    razao_social: "", nome_fantasia: "", cnpj: "", ie: "",
    email: "", telefone: "", regime_tributario: "simples_nacional",
    logradouro: "", numero: "", complemento: "", bairro: "",
    municipio: "", uf: "", cep: "",
    nfe_io_company_id: "", nfe_ambiente: "homologacao", nfe_serie: "1",
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
            razao_social: emp.razao_social || "",
            nome_fantasia: emp.nome_fantasia || "",
            cnpj: emp.cnpj || "",
            ie: emp.ie || "",
            email: emp.email || "",
            telefone: emp.telefone || "",
            regime_tributario: emp.regime_tributario || "simples_nacional",
            logradouro: emp.logradouro || "",
            numero: emp.numero || "",
            complemento: emp.complemento || "",
            bairro: emp.bairro || "",
            municipio: emp.municipio || "",
            uf: emp.uf || "",
            cep: emp.cep || "",
            nfe_io_company_id: emp.nfe_io_company_id || "",
            nfe_ambiente: emp.nfe_ambiente || "homologacao",
            nfe_serie: emp.nfe_serie || "1",
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
    // Atualiza o localStorage
    const updated = {
      ...client,
      razao_social: form.razao_social,
      cnpj: form.cnpj,
      nfe_io_company_id: form.nfe_io_company_id,
      ambiente: form.nfe_ambiente,
      nfe_serie: form.nfe_serie,
    };
    localStorage.setItem("emissor_current_client", JSON.stringify(updated));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const testarConexao = async () => {
    if (!form.nfe_io_company_id) return;
    setTestando(true);
    setTesteResult(null);
    const res = await base44.functions.invoke('testarNfeIo', { companyId: form.nfe_io_company_id });
    setTesteResult(res.data);
    setTestando(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Empresa</h1>
        <p className="text-gray-500 text-sm">{client?.razao_social}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setAba(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                aba === id ? "border-[#0B63D4] text-[#0B63D4]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* Dados Básicos */}
          {aba === "basico" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Razão Social *</label>
                  <input required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                    value={form.razao_social} onChange={e => set("razao_social", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Nome Fantasia</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                    value={form.nome_fantasia} onChange={e => set("nome_fantasia", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">CNPJ *</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                    placeholder="00.000.000/0000-00" value={form.cnpj} onChange={e => set("cnpj", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Inscrição Estadual</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                    placeholder="Deixe vazio se isento" value={form.ie} onChange={e => set("ie", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">E-mail</label>
                  <input type="email" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                    value={form.email} onChange={e => set("email", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Telefone</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                    value={form.telefone} onChange={e => set("telefone", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Regime Tributário</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] bg-white"
                    value={form.regime_tributario} onChange={e => set("regime_tributario", e.target.value)}>
                    <option value="simples_nacional">Simples Nacional</option>
                    <option value="lucro_presumido">Lucro Presumido</option>
                    <option value="lucro_real">Lucro Real</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Endereço */}
          {aba === "endereco" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700 block mb-1">Logradouro</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  placeholder="Rua, Av, Travessa..." value={form.logradouro} onChange={e => set("logradouro", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Número</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  value={form.numero} onChange={e => set("numero", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Complemento</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  value={form.complemento} onChange={e => set("complemento", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Bairro</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  value={form.bairro} onChange={e => set("bairro", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Município</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  value={form.municipio} onChange={e => set("municipio", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">UF</label>
                <input maxLength={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] uppercase"
                  value={form.uf} onChange={e => set("uf", e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">CEP</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  placeholder="00000-000" value={form.cep} onChange={e => set("cep", e.target.value)} />
              </div>
            </div>
          )}

          {/* NFE.io */}
          {aba === "nfeio" && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Company ID (Empresa ID na NFE.io) *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] font-mono"
                  placeholder="Ex: 8283254bc21a45618bc77e2fbc817970"
                  value={form.nfe_io_company_id} onChange={e => set("nfe_io_company_id", e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">
                  Encontre em <a href="https://app.nfe.io" target="_blank" rel="noreferrer" className="text-blue-600 underline inline-flex items-center gap-0.5">app.nfe.io → Empresa → Chaves de Acesso <ExternalLink className="w-3 h-3" /></a>
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Ambiente de Emissão</label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                    form.nfe_ambiente === "homologacao" ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:bg-gray-50"
                  }`}>
                    <input type="radio" name="ambiente" value="homologacao"
                      checked={form.nfe_ambiente === "homologacao"}
                      onChange={() => set("nfe_ambiente", "homologacao")} className="hidden" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700">🧪 Homologação</p>
                      <p className="text-xs text-gray-400">Notas de teste</p>
                    </div>
                  </label>
                  <label className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                    form.nfe_ambiente === "producao" ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"
                  }`}>
                    <input type="radio" name="ambiente" value="producao"
                      checked={form.nfe_ambiente === "producao"}
                      onChange={() => set("nfe_ambiente", "producao")} className="hidden" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">✅ Produção</p>
                      <p className="text-xs text-gray-400">Notas com valor fiscal</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Série da NF-e</label>
                <input maxLength={3} className="w-32 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  value={form.nfe_serie} onChange={e => set("nfe_serie", e.target.value)} />
              </div>

              {/* Teste de conexão */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Testar Conexão com NFE.io</p>
                <button onClick={testarConexao} disabled={testando || !form.nfe_io_company_id}
                  className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-[#0B63D4] text-[#0B63D4] hover:bg-blue-50 disabled:opacity-40 transition-colors">
                  {testando ? <><Loader2 className="w-4 h-4 animate-spin" /> Testando...</> : "Testar agora"}
                </button>

                {testeResult && (
                  <div className={`mt-3 rounded-xl p-4 border text-sm ${
                    testeResult.ok ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                  }`}>
                    <div className="flex items-center gap-2 font-semibold mb-2">
                      {testeResult.ok
                        ? <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> <span className="text-emerald-700">Empresa encontrada na NFE.io!</span></>
                        : <><AlertTriangle className="w-4 h-4 text-red-500" /> <span className="text-red-700">Status: {testeResult.status}</span></>}
                    </div>
                    <pre className="text-xs font-mono overflow-auto max-h-40 whitespace-pre-wrap text-gray-600">
                      {JSON.stringify(testeResult.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botão salvar */}
        <div className="px-6 pb-6">
          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
            style={{ backgroundColor: "#0B63D4" }}>
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              : saved
              ? <><Save className="w-4 h-4" /> ✓ Salvo!</>
              : <><Save className="w-4 h-4" /> Salvar Alterações</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}