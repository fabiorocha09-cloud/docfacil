import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { base44 } from "@/api/base44Client";
import { Plus, Settings, Pencil, Trash2, Link, AlertCircle } from "lucide-react";
import PortalModal from "@/components/PortalModal";

const tipoLabels = { federal: "Federal", estadual: "Estadual", municipal: "Municipal", fgts: "FGTS", trabalhista: "Trabalhista" };
const periodicidadeLabels = { diario: "Diário", semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal" };

export default function Configuracoes() {
  const { theme } = useTheme();
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
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Configurações de Portais</h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Configure os robôs de busca de certidões por empresa</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditando(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Novo Portal
          </button>
        )}
      </div>

      <div className={`rounded-xl p-4 flex items-start gap-3 ${theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
        <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
        <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
          <p className="font-medium mb-1">Como funciona</p>
          <p>Configure a URL do portal governamental para cada tipo de certidão por empresa. O robô usará esses links para buscar e baixar as certidões automaticamente conforme a periodicidade configurada. Para portais com CAPTCHA, configure um serviço como 2Captcha ou Anti-Captcha.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : portais.length === 0 ? (
        <div className={`rounded-xl p-16 text-center ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
          <Settings className={`w-10 h-10 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Nenhum portal configurado ainda.</p>
        </div>
      ) : (
        <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-white/5 border border-white/10 backdrop-blur-md' : 'bg-white border border-gray-200'}`}>
          <div className={`divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-gray-100'}`}>
            {portais.map(portal => (
              <div key={portal.id} className={`flex items-center justify-between px-5 py-4 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{portal.empresa_nome}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{tipoLabels[portal.tipo]}</span>
                    {portal.subtipo && <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>{portal.subtipo}</span>}
                    {portal.tem_captcha && (
                      <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">CAPTCHA</span>
                    )}
                    {!portal.ativo && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inativo</span>
                    )}
                  </div>
                  <div className={`flex items-center gap-3 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="flex items-center gap-1"><Link className="w-3 h-3" />{portal.url_portal}</span>
                    <span>{periodicidadeLabels[portal.periodicidade]}</span>
                    {portal.dia_execucao && <span>Dia {portal.dia_execucao}</span>}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => { setEditando(portal); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deletar(portal.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
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
        <PortalModal
          portal={editando}
          empresas={empresas}
          onClose={() => setModalOpen(false)}
          onSave={() => { setModalOpen(false); carregar(); }}
        />
      )}
    </div>
  );
}