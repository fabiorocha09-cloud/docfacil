import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { base44 } from "@/api/base44Client";
import { FileCheck2, Building2, AlertTriangle, CheckCircle2, Clock, XCircle, FileSearch } from "lucide-react";
import { TIPOS_CERTIDAO } from "@/lib/constants";
import { Link, useNavigate } from "react-router-dom";

const statusConfig = {
  regular: { label: "Regular", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  irregular: { label: "Irregular", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
  pendente: { label: "Pendente", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: Clock },
  processando: { label: "Processando", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Clock },
  erro: { label: "Erro", color: "text-gray-700 bg-gray-50 border-gray-200", icon: AlertTriangle },
};

export default function Dashboard() {
  const { theme } = useTheme();
  const [certidoes, setCertidoes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      base44.entities.Certidao.list("-created_date", 1000),
      base44.entities.Empresa.list(),
    ]).then(([c, e]) => {
      setCertidoes(c);
      setEmpresas(e);
      setLoading(false);
    });
  }, []);

  const hoje = new Date();
  const ativas = certidoes.filter(c => !c.excluida);
  const vencendoEm7 = ativas.filter(c => {
    if (!c.data_vencimento) return false;
    const diff = (new Date(c.data_vencimento) - hoje) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const getStatusEfetivo = (cert) => {
    if (cert.data_vencimento && new Date(cert.data_vencimento) < new Date()) return "irregular";
    return cert.status;
  };

  // Calcula certidões ausentes: tipos que deveriam existir mas não existem para cada empresa ativa
  const empresasAtivas = empresas.filter(e => e.status === "ativo" && !e.excluida);
  const totalAusentes = empresasAtivas.reduce((total, empresa) => {
    const naoAplicaveis = empresa.certidoes_nao_aplicaveis || [];
    const tiposEsperados = TIPOS_CERTIDAO.map(t => t.tipo).filter(t => !naoAplicaveis.includes(t));
    const tiposPresentes = ativas
      .filter(c => c.empresa_id === empresa.id)
      .map(c => c.tipo);
    const ausentes = tiposEsperados.filter(t => !tiposPresentes.includes(t));
    return total + ausentes.length;
  }, 0);

  const stats = [
    { label: "Empresas Ativas", value: empresasAtivas.length, icon: Building2, color: "text-blue-600 bg-blue-50", onClick: () => navigate("/Empresas") },
    { label: "Certidões Regulares", value: ativas.filter(c => getStatusEfetivo(c) === "regular").length, icon: CheckCircle2, color: "text-green-600 bg-green-50", onClick: () => navigate("/Certidoes?status=regular") },
    { label: "Certidões Irregulares", value: ativas.filter(c => getStatusEfetivo(c) === "irregular").length, icon: XCircle, color: "text-red-600 bg-red-50", onClick: () => navigate("/Certidoes?status=irregular") },
    { label: "Vencendo em 7 dias", value: vencendoEm7.length, icon: AlertTriangle, color: "text-yellow-600 bg-yellow-50", onClick: () => navigate("/Certidoes?vencimento=7dias") },
    { label: "Certidões Ausentes", value: totalAusentes, icon: FileSearch, color: "text-purple-600 bg-purple-50", onClick: () => navigate("/Certidoes?status=ausente") },
  ];

  const recentes = certidoes.slice(0, 8);

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Visão geral da saúde fiscal dos seus clientes</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map(({ label, value, icon: Icon, color, onClick }) => (
            <div
              key={label}
              onClick={onClick || undefined}
              className={`rounded-2xl p-5 transition-all ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
              style={cardStyle}
              onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = "rgba(58,141,255,0.3)")}
              onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(58,141,255,0.1)" }}>
                <Icon className="w-5 h-5" style={{ color: "#5E9BFF" }} />
              </div>
              <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{value}</p>
              <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>Certidões Recentes</h2>
          <Link to="/Certidoes" className="text-sm font-medium" style={{ color: "#5E9BFF", fontFamily: "'Rethink Sans', sans-serif" }}>Ver todas</Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}
          </div>
        ) : recentes.length === 0 ? (
          <div className="p-10 text-center">
            <FileCheck2 className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: "#A0B1D4" }} />
            <p style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Nenhuma certidão cadastrada ainda.</p>
          </div>
        ) : (
          <div>
            {recentes.map(cert => {
              const cfg = statusConfig[cert.status] || statusConfig.pendente;
              const Icon = cfg.icon;
              return (
                <div key={cert.id} className="flex items-center justify-between px-5 py-3 transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div>
                    <p className="text-sm font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{cert.empresa_nome}</p>
                    <p className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{cert.subtipo || cert.tipo} · {cert.empresa_cnpj}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {vencendoEm7.length > 0 && (
        <div className="rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
          onClick={() => navigate("/Certidoes?vencimento=7dias")}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" style={{ color: "#f59e0b" }} />
            <h3 className="font-semibold" style={{ color: "#fcd34d", fontFamily: "'Manrope', sans-serif" }}>Certidões vencendo em 7 dias</h3>
          </div>
          <div className="space-y-2">
            {vencendoEm7.map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span style={{ color: "#fcd34d", fontFamily: "'Rethink Sans', sans-serif" }}>{c.empresa_nome} — {c.subtipo || c.tipo}</span>
                <span className="font-medium" style={{ color: "#fcd34d" }}>{new Date(c.data_vencimento).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}