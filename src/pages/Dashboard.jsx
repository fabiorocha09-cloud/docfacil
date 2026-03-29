import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { base44 } from "@/api/base44Client";
import { FileCheck2, Building2, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
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
      base44.entities.Certidao.list("-created_date", 100),
      base44.entities.Empresa.list(),
    ]).then(([c, e]) => {
      setCertidoes(c);
      setEmpresas(e);
      setLoading(false);
    });
  }, []);

  const hoje = new Date();
  const vencendoEm7 = certidoes.filter(c => {
    if (!c.data_vencimento) return false;
    const diff = (new Date(c.data_vencimento) - hoje) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const getStatusEfetivo = (cert) => {
    if (cert.data_vencimento && new Date(cert.data_vencimento) < new Date()) return "irregular";
    return cert.status;
  };

  const stats = [
    { label: "Empresas Ativas", value: empresas.filter(e => e.status === "ativo" && !e.excluida).length, icon: Building2, color: "text-blue-600 bg-blue-50", onClick: () => navigate("/Empresas") },
    { label: "Certidões Regulares", value: certidoes.filter(c => getStatusEfetivo(c) === "regular").length, icon: CheckCircle2, color: "text-green-600 bg-green-50", onClick: () => navigate("/Certidoes?status=regular") },
    { label: "Certidões Irregulares", value: certidoes.filter(c => getStatusEfetivo(c) === "irregular").length, icon: XCircle, color: "text-red-600 bg-red-50", onClick: () => navigate("/Certidoes?status=irregular") },
    { label: "Vencendo em 7 dias", value: vencendoEm7.length, icon: AlertTriangle, color: "text-yellow-600 bg-yellow-50", onClick: () => navigate("/Certidoes?vencimento=7dias") },
  ];

  const recentes = certidoes.slice(0, 8);

  return (
    <div className={`space-y-6 ${theme === 'dark' ? 'bg-gray-900 min-h-screen' : 'bg-gray-50'}`}>
      <div>
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Visão geral da saúde fiscal dos seus clientes</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-24 rounded-xl animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, onClick }) => (
            <div
              key={label}
              onClick={onClick || undefined}
              className={`rounded-xl border p-5 backdrop-blur-md transition-all ${
                theme === 'dark'
                  ? `bg-white/10 border-white/20 hover:bg-white/15 ${onClick ? 'cursor-pointer' : ''}`
                  : `bg-white border-gray-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}`
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm ${
                theme === 'dark' ? 'bg-white/20' : color
              }`}>
                <Icon className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : ''}`} />
              </div>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</p>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className={`rounded-xl border overflow-hidden backdrop-blur-md ${
        theme === 'dark' ? 'bg-white/10 border-white/20' : 'bg-white border-gray-200'
      }`}>
        <div className={`flex items-center justify-between p-5 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
          <h2 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Certidões Recentes</h2>
          <Link to="/Certidoes" className="text-sm hover:underline" style={{ color: theme === 'dark' ? '#93c5fd' : '#2563eb' }}>Ver todas</Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className={`h-10 rounded animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`} />)}
          </div>
        ) : recentes.length === 0 ? (
          <div className={`p-10 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            <FileCheck2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma certidão cadastrada ainda.</p>
          </div>
        ) : (
          <div className={`divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-gray-100'}`}>
            {recentes.map(cert => {
              const cfg = statusConfig[cert.status] || statusConfig.pendente;
              const Icon = cfg.icon;
              return (
                <div key={cert.id} className={`flex items-center justify-between px-5 py-3 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{cert.empresa_nome}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{cert.subtipo || cert.tipo} · {cert.empresa_cnpj}</p>
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
        <div
          className={`rounded-xl p-5 cursor-pointer transition-all backdrop-blur-md border ${
            theme === 'dark'
              ? 'bg-amber-500/10 border-amber-400/30 hover:bg-amber-500/20'
              : 'bg-yellow-50 border-yellow-200 hover:shadow-md hover:border-yellow-400'
          }`}
          onClick={() => navigate("/Certidoes?vencimento=7dias")}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className={`w-5 h-5 ${theme === 'dark' ? 'text-amber-400' : 'text-yellow-600'}`} />
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-amber-200' : 'text-yellow-800'}`}>Certidões vencendo em 7 dias</h3>
          </div>
          <div className="space-y-2">
            {vencendoEm7.map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className={theme === 'dark' ? 'text-amber-300' : 'text-yellow-800'}>{c.empresa_nome} — {c.subtipo || c.tipo}</span>
                <span className={`font-medium ${theme === 'dark' ? 'text-amber-300' : 'text-yellow-700'}`}>{new Date(c.data_vencimento).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}