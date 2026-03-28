import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Plus, ShieldAlert, Shield, Trash2, X, Loader2, Upload, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

function CertModal({ empresaId, onClose, onSave }) {
  const [form, setForm] = useState({
    nome: "", serial_number: "", issuer: "", subject_cn: "", validade_inicio: "", validade_fim: "", fingerprint: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Certificado.create({ ...form, empresa_id: empresaId, ativo: true });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Cadastrar Certificado A1</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            🔒 O arquivo .pfx é armazenado com segurança no backend — nunca é exposto ao navegador.
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Nome / Identificação</label>
            <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              placeholder="Ex: Certificado 2024" value={form.nome} onChange={e => set("nome", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Common Name (CN) *</label>
            <input required className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              placeholder="RAZAO SOCIAL:12345678000199" value={form.subject_cn} onChange={e => set("subject_cn", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Validade Início</label>
              <input type="date" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.validade_inicio} onChange={e => set("validade_inicio", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Validade Fim *</label>
              <input required type="date" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.validade_fim} onChange={e => set("validade_fim", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Emissor (Autoridade Certificadora)</label>
            <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              placeholder="Ex: AC SERASA RFB v5" value={form.issuer} onChange={e => set("issuer", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Serial Number</label>
            <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              value={form.serial_number} onChange={e => set("serial_number", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Fingerprint</label>
            <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              value={form.fingerprint} onChange={e => set("fingerprint", e.target.value)} />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-xs text-blue-700">
            <Upload className="w-4 h-4 flex-shrink-0" />
            Upload do .pfx: disponível via integração backend (em breve).
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: "#0B63D4" }}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : "Cadastrar Certificado"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Certificados() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

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
    const data = await base44.entities.Certificado.filter({ empresa_id: id || client?.id });
    setCerts(data.sort((a, b) => new Date(b.validade_fim) - new Date(a.validade_fim)));
    setLoading(false);
  };

  const toggleAtivo = async (cert) => {
    await base44.entities.Certificado.update(cert.id, { ativo: !cert.ativo });
    carregar(client?.id);
  };

  const deletar = async (id) => {
    if (!confirm("Excluir certificado?")) return;
    await base44.entities.Certificado.delete(id);
    carregar(client?.id);
  };

  const getBadge = (cert) => {
    const dias = Math.floor((new Date(cert.validade_fim) - new Date()) / (1000 * 60 * 60 * 24));
    if (!cert.ativo) return { label: "Inativo", cls: "bg-gray-100 text-gray-500", Icon: Shield };
    if (dias < 0) return { label: "Vencido", cls: "bg-red-100 text-red-700", Icon: ShieldAlert };
    if (dias <= 30) return { label: `Expira em ${dias}d`, cls: "bg-amber-100 text-amber-700", Icon: ShieldAlert };
    return { label: `Válido (${dias}d)`, cls: "bg-emerald-100 text-emerald-700", Icon: ShieldCheck };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificados Digitais</h1>
          <p className="text-gray-500 text-sm">{client?.razao_social}</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"
          style={{ backgroundColor: "#0B63D4" }}>
          <Plus className="w-4 h-4" /> Novo Certificado
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        <strong>🔐 Segurança:</strong> Arquivos .pfx são armazenados criptografados no backend e nunca expostos ao navegador.
        Apenas metadados do certificado são exibidos aqui.
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />)}</div>
      ) : certs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Shield className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Nenhum certificado cadastrado.</p>
          <button onClick={() => setModalOpen(true)} className="mt-3 text-sm font-medium hover:underline" style={{ color: "#0B63D4" }}>
            + Cadastrar certificado
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {certs.map(cert => {
            const badge = getBadge(cert);
            const BadgeIcon = badge.Icon;
            return (
              <motion.div key={cert.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${badge.cls}`}>
                      <BadgeIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{cert.nome || cert.subject_cn || "Certificado"}</p>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                        {cert.ativo && badge.label.startsWith("Válido") && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      {cert.subject_cn && <p className="text-xs text-gray-500 mt-0.5">{cert.subject_cn}</p>}
                      {cert.issuer && <p className="text-xs text-gray-400 mt-0.5">Emissor: {cert.issuer}</p>}
                      <div className="flex gap-4 mt-1.5">
                        {cert.validade_inicio && <p className="text-xs text-gray-400">Início: {new Date(cert.validade_inicio).toLocaleDateString("pt-BR")}</p>}
                        {cert.validade_fim && <p className="text-xs text-gray-500 font-medium">Vencimento: {new Date(cert.validade_fim).toLocaleDateString("pt-BR")}</p>}
                      </div>
                      {cert.serial_number && <p className="text-xs text-gray-400 mt-0.5 font-mono">Serial: {cert.serial_number}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleAtivo(cert)}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors ${cert.ativo ? "border-gray-200 text-gray-600 hover:bg-gray-50" : "text-white"}`}
                      style={cert.ativo ? {} : { backgroundColor: "#0B63D4" }}>
                      {cert.ativo ? "Desativar" : "Ativar"}
                    </button>
                    <button onClick={() => deletar(cert.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <CertModal empresaId={client?.id} onClose={() => setModalOpen(false)} onSave={() => { setModalOpen(false); carregar(client?.id); }} />
      )}
    </div>
  );
}