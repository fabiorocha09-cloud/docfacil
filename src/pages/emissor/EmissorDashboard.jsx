import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { FileText, CheckCircle2, XCircle, Clock, Plus, TrendingUp, ArrowRight, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_CFG = {
  rascunho: { label: "Rascunho", cls: "bg-gray-100 text-gray-600" },
  validada: { label: "Validada", cls: "bg-blue-100 text-blue-700" },
  transmitindo: { label: "Transmitindo", cls: "bg-amber-100 text-amber-700" },
  transmitida: { label: "Transmitida", cls: "bg-emerald-100 text-emerald-700" },
  rejeitada: { label: "Rejeitada", cls: "bg-red-100 text-red-700" },
  cancelada: { label: "Cancelada", cls: "bg-gray-200 text-gray-500" },
};

export default function EmissorDashboard() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [notas, setNotas] = useState([]);
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const [notasData, certsData] = await Promise.all([
      base44.entities.NotaFiscal55.filter({ empresa_id: id }),
      base44.entities.Certificado.filter({ empresa_id: id }),
    ]);
    setNotas(notasData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    const certAtivo = certsData.filter(c => c.ativo).sort((a, b) => new Date(b.validade_fim) - new Date(a.validade_fim))[0];
    setCert(certAtivo || null);
    setLoading(false);
  };

  const hoje = new Date();
  const notasMes = notas.filter(n => {
    const d = new Date(n.created_date);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  });
  const diasRestantes = cert ? Math.floor((new Date(cert.validade_fim) - hoje) / (1000 * 60 * 60 * 24)) : null;
  const certAlerta = !cert || diasRestantes < 30;

  const kpis = [
    { label: "Emitidas (mês)", value: notasMes.filter(n => n.status_sefaz === "transmitida").length, icon: CheckCircle2, color: "#06B58A", bg: "#ECFDF5" },
    { label: "Rascunhos", value: notas.filter(n => n.status_sefaz === "rascunho").length, icon: Clock, color: "#D97706", bg: "#FFFBEB" },
    { label: "Rejeitadas", value: notas.filter(n => n.status_sefaz === "rejeitada").length, icon: XCircle, color: "#E02424", bg: "#FEF2F2" },
    { label: "Total geral", value: notas.length, icon: TrendingUp, color: "#0B63D4", bg: "#E6F0FF" },
  ];

  return (
    <div className="space-y-6">
      {certAlerta && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-2xl border ${!cert ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
          <ShieldAlert className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {!cert ? "Nenhum certificado digital ativo" : `Certificado expirando em ${diasRestantes} dia(s)!`}
            </p>
            <p className="text-xs opacity-75 mt-0.5">
              {!cert ? "Cadastre um certificado A1 para emitir NF-e." : "Renove o certificado o quanto antes para não interromper emissões."}
            </p>
          </div>
          <Link to="/emissor/certificados" className="text-xs font-semibold underline whitespace-nowrap">Gerenciar →</Link>
        </motion.div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client?.razao_social || "Dashboard"}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Visão geral das notas fiscais</p>
        </div>
        <Link to="/emissor/emitir"
          className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm"
          style={{ backgroundColor: "#0B63D4" }}>
          <Plus className="w-4 h-4" /> Emitir NF-e
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: kpi.bg }}>
                <Icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? "—" : kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Últimas Notas</h2>
          <Link to="/emissor/historico" className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "#0B63D4" }}>
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : notas.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma nota emitida ainda.</p>
            <Link to="/emissor/emitir" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: "#0B63D4" }}>
              Emitir primeira NF-e →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notas.slice(0, 6).map(nota => {
              const cfg = STATUS_CFG[nota.status_sefaz] || STATUS_CFG.rascunho;
              return (
                <div key={nota.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{nota.destinatario_nome || "Sem destinatário"}</p>
                      <p className="text-xs text-gray-400">{new Date(nota.created_date).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span className="font-semibold text-sm text-gray-800">
                      {nota.valor_total ? `R$ ${Number(nota.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}