import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModuloDropdown from "@/components/ModuloDropdown";
import { useTheme } from "@/context/ThemeContext";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Building2, Zap, ShieldCheck, ShieldAlert, Shield, ChevronRight, Edit2, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const REGIME_LABELS = {
  simples_nacional: "Simples Nacional",
  lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real",
};

function EmpresaModal({ empresa, onClose, onSave }) {
  const [form, setForm] = useState(empresa || {
    cnpj: "", razao_social: "", nome_fantasia: "", email: "", telefone: "",
    municipio: "", uf: "PA", ie: "", inscricao_municipal: "", regime_tributario: "simples_nacional", ativo: true, nfe_ativo: true,
    nfe_io_company_id: "", nfe_ambiente: "homologacao",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (empresa?.id) await base44.entities.EmpresaCliente.update(empresa.id, form);
    else await base44.entities.EmpresaCliente.create(form);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{empresa ? "Editar Empresa" : "Nova Empresa Cliente"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Razão Social *</label>
            <input required className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              value={form.razao_social} onChange={e => set("razao_social", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">CNPJ *</label>
              <input required placeholder="00.000.000/0000-00" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.cnpj} onChange={e => set("cnpj", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nome Fantasia</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.nome_fantasia} onChange={e => set("nome_fantasia", e.target.value)} />
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
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">Inscrição Estadual</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                placeholder="Deixe em branco se isento" value={form.ie || ""} onChange={e => set("ie", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">Inscrição Municipal (ISS)</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                placeholder="Deixe em branco se não aplicável" value={form.inscricao_municipal || ""} onChange={e => set("inscricao_municipal", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Regime Tributário</label>
            <select className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              value={form.regime_tributario} onChange={e => set("regime_tributario", e.target.value)}>
              <option value="simples_nacional">Simples Nacional</option>
              <option value="lucro_presumido">Lucro Presumido</option>
              <option value="lucro_real">Lucro Real</option>
            </select>
          </div>
          {/* NFE.io Config */}
          <div className="border-t border-gray-100 pt-3 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Configuração NFE.io</p>
            <div>
              <label className="text-sm font-medium text-gray-700">NFE.io Company ID *</label>
              <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                placeholder="ID da empresa no painel NFE.io"
                value={form.nfe_io_company_id || ""} onChange={e => set("nfe_io_company_id", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Ambiente de Emissão</label>
              <div className="mt-1 flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="ambiente" value="homologacao"
                    checked={form.nfe_ambiente === "homologacao"}
                    onChange={() => set("nfe_ambiente", "homologacao")}
                    className="text-amber-500" />
                  <span className="text-sm text-amber-700 font-medium">🧪 Homologação</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="ambiente" value="producao"
                    checked={form.nfe_ambiente === "producao"}
                    onChange={() => set("nfe_ambiente", "producao")}
                    className="text-emerald-500" />
                  <span className="text-sm text-emerald-700 font-medium">✅ Produção</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex-1 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#0B63D4" }}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : "Salvar"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function PainelContador() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [certs, setCerts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    setLoading(true);
    const [emps, certsData] = await Promise.all([
      base44.entities.EmpresaCliente.list("-created_date"),
      base44.entities.Certificado.list(),
    ]);
    setEmpresas(emps);
    setCerts(certsData);
    setLoading(false);
  };

  const getCertStatus = (empresaId) => {
    const cert = certs.filter(c => c.empresa_id === empresaId && c.ativo)
      .sort((a, b) => new Date(b.validade_fim) - new Date(a.validade_fim))[0];
    if (!cert) return "nenhum";
    const dias = Math.floor((new Date(cert.validade_fim) - new Date()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return "vencido";
    if (dias <= 30) return "expirando";
    return "ok";
  };

  const acessarEmissor = (empresa) => {
    localStorage.setItem("emissor_current_client", JSON.stringify({
      id: empresa.id, razao_social: empresa.razao_social, cnpj: empresa.cnpj, regime: empresa.regime_tributario,
      nfe_io_company_id: empresa.nfe_io_company_id, ambiente: empresa.nfe_ambiente || "homologacao",
    }));
    navigate("/emissor/dashboard");
  };

  const filtradas = empresas.filter(e =>
    e.razao_social?.toLowerCase().includes(search.toLowerCase()) || e.cnpj?.includes(search)
  );

  const certBadge = {
    ok: { label: "Certificado OK", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: ShieldCheck },
    expirando: { label: "Expirando em breve", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: ShieldAlert },
    vencido: { label: "Cert. Vencido", cls: "bg-red-50 text-red-700 border-red-200", Icon: ShieldAlert },
    nenhum: { label: "Sem certificado", cls: "bg-gray-100 text-gray-500 border-gray-200", Icon: Shield },
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : ''}`} style={theme === 'dark' ? {} : { backgroundColor: "#F0F6FF" }}>
      {/* Header azul */}
      <div className="px-6 pt-10 pb-8" style={{ backgroundColor: "#0B63D4" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-2xl leading-none">DocFácil Emissor</h1>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>Painel do Contador</p>
              </div>
            </div>
            <ModuloDropdown moduloAtual="emissor" dark />
          </div>
          <p className="text-sm mt-4" style={{ color: "rgba(255,255,255,0.75)" }}>
            {empresas.length} empresa(s) na carteira · Módulo NF-e Modelo 55
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] shadow-sm ${theme === 'dark' ? 'bg-white/10 border border-white/20 text-white' : 'bg-white border border-gray-200'}`}
              placeholder="Buscar por razão social ou CNPJ..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => { setEditando(null); setModalOpen(true); }}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"
            style={{ backgroundColor: "#0B63D4" }}>
            <Plus className="w-4 h-4" /> Nova Empresa
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className={`h-48 rounded-2xl animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-white border border-gray-100'}`} />)}
          </div>
        ) : filtradas.length === 0 ? (
          <div className={`rounded-2xl p-16 text-center shadow-sm ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100'}`}>
            <Building2 className={`w-10 h-10 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-200'}`} />
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Nenhuma empresa encontrada.</p>
            <button onClick={() => { setEditando(null); setModalOpen(true); }} className="mt-3 text-sm font-medium hover:underline" style={{ color: "#0B63D4" }}>
              + Adicionar empresa
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtradas.map(empresa => {
                const status = getCertStatus(empresa.id);
                const { label, cls, Icon: BadgeIcon } = certBadge[status];
                return (
                  <motion.div key={empresa.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow backdrop-blur-md ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E6F0FF" }}>
                          <Building2 className="w-5 h-5" style={{ color: "#0B63D4" }} />
                        </div>
                        <div className="min-w-0">
                            <p className={`font-semibold text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{empresa.razao_social}</p>
                            <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>{empresa.cnpj}</p>
                          </div>
                      </div>
                      <button onClick={() => { setEditando(empresa); setModalOpen(true); }} className="text-gray-300 hover:text-[#0B63D4] p-1">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {empresa.regime_tributario && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{REGIME_LABELS[empresa.regime_tributario]}</span>
                        )}
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>
                      <BadgeIcon className={`w-3 h-3 ${status === "expirando" ? "animate-pulse" : ""}`} />
                      {label}
                    </span>
                    {empresa.nfe_ambiente === "producao" ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">✅ Produção</span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">🧪 Homologação</span>
                    )}
                    </div>

                    <button onClick={() => acessarEmissor(empresa)}
                      className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-2.5 rounded-xl shadow-sm"
                      style={{ backgroundColor: "#0B63D4" }}>
                      <Zap className="w-4 h-4" /> Acessar Emissor
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {modalOpen && (
        <EmpresaModal empresa={editando} onClose={() => setModalOpen(false)} onSave={() => { setModalOpen(false); carregar(); }} />
      )}
    </div>
  );
}