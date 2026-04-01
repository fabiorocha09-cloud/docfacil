import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Settings, Pencil, Trash2, Link, AlertCircle } from "lucide-react";
import PortalModal from "@/components/PortalModal";

const tipoLabels = { federal: "Federal", estadual: "Estadual", municipal: "Municipal", fgts: "FGTS", trabalhista: "Trabalhista" };
const periodicidadeLabels = { diario: "Diário", semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal" };

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };

export default function Configuracoes() {
  const [portais, setPortais] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    carregar();
    base44.entities.Empresa.list().then(setEmpresas);
  }, []);

  const carregar = async () => {
    const data = await base44.entities.PortalConfig.list("-created_date");
    setPortais(data);
    setLoading(false);
  };

  const deletar = async (id) => {
    if (!confirm("Remover esta configuração?")) return;
    await base44.entities.PortalConfig.delete(id);
    carregar();
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>Configurações de Portais</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Configure os robôs de busca de certidões por empresa</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditando(null); setModalOpen(true); }}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
            <Plus className="w-4 h-4" /> Novo Portal
          </button>
        )}
      </div>

      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(58,141,255,0.08)", border: "1px solid rgba(58,141,255,0.2)" }}>
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#5E9BFF" }} />
        <div className="text-sm" style={{ color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>
          <p className="font-semibold mb-1" style={{ color: "#5E9BFF", fontFamily: "'Manrope', sans-serif" }}>Como funciona</p>
          <p>Configure a URL do portal governamental para cada tipo de certidão por empresa. O robô usará esses links para buscar e baixar as certidões automaticamente conforme a periodicidade configurada. Para portais com CAPTCHA, configure um serviço como 2Captcha ou Anti-Captcha.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}</div>
      ) : portais.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={cardStyle}>
          <Settings className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#A0B1D4" }} />
          <p style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Nenhum portal configurado ainda.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div>
            {portais.map(portal => (
              <div key={portal.id} className="flex items-center justify-between px-5 py-4 transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{portal.empresa_nome}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "#A0B1D4", fontFamily: "'Outfit', sans-serif" }}>
                      {tipoLabels[portal.tipo]}
                    </span>
                    {portal.subtipo && <span className="text-xs" style={{ color: "#6B7FA3" }}>{portal.subtipo}</span>}
                    {portal.tem_captcha && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)" }}>CAPTCHA</span>
                    )}
                    {!portal.ativo && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "#6B7FA3" }}>Inativo</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>
                    <span className="flex items-center gap-1"><Link className="w-3 h-3" />{portal.url_portal}</span>
                    <span>{periodicidadeLabels[portal.periodicidade]}</span>
                    {portal.dia_execucao && <span>Dia {portal.dia_execucao}</span>}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1.5 ml-4">
                    <button onClick={() => { setEditando(portal); setModalOpen(true); }}
                      className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#5E9BFF"}
                      onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deletar(portal.id)}
                      className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                      onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <PortalModal portal={editando} empresas={empresas} onClose={() => setModalOpen(false)} onSave={() => { setModalOpen(false); carregar(); }} />
      )}
    </div>
  );
}