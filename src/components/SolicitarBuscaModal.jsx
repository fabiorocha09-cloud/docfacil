import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, AlertTriangle, CheckCircle2, Search, Info } from "lucide-react";

const TIPOS = [
  { key: "federal", label: "Federal", padrao: true, descricao: "Receita Federal / PGFN" },
  { key: "fgts", label: "FGTS", padrao: true, descricao: "CRF - Caixa Econômica" },
  { key: "trabalhista", label: "Trabalhista", padrao: true, descricao: "CNDT - TST" },
  { key: "estadual", label: "Estadual", padrao: false, descricao: "SEFAZ do estado da empresa" },
  { key: "municipal", label: "Municipal", padrao: false, descricao: "Prefeitura do município" },
];

export default function SolicitarBuscaModal({ empresa, onClose, onSolicitado }) {
  const [portaisConfig, setPortaisConfig] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [solicitando, setSolicitando] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.PortalConfig.filter({ empresa_id: empresa.id }),
      base44.auth.me(),
    ]).then(([configs, me]) => {
      setPortaisConfig(configs);
      setUser(me);
      setLoading(false);
    });
  }, [empresa.id]);

  const toggleTipo = (key) => {
    setSelecionados(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const getConfig = (tipoKey) => portaisConfig.find(p => p.tipo === tipoKey && p.ativo);

  const handleSolicitar = async () => {
    if (selecionados.length === 0) return;
    setSolicitando(true);

    const agora = new Date().toISOString();

    for (const tipo of selecionados) {
      const config = getConfig(tipo);

      if (!config) {
        const tipoInfo = TIPOS.find(t => t.key === tipo);
        await base44.entities.LogRobo.create({
          timestamp: agora,
          empresa_id: empresa.id,
          empresa_nome: empresa.nome,
          tipo_certidao: tipo,
          acao: "Busca solicitada manualmente",
          detalhes: tipoInfo?.padrao
            ? `Sem PortalConfig ativa. Tipo padrão (${tipoInfo.descricao}) — URL padrão pode ser usada, mas captcha e periodicidade não configurados.`
            : `Sem PortalConfig ativa para tipo ${tipo}. Busca não pode ser realizada sem configuração de portal.`,
          status: "aviso",
          iniciada_por_email: user?.email || "",
          iniciada_por_nome: user?.full_name || "",
        });
      } else {
        await base44.entities.LogRobo.create({
          timestamp: agora,
          empresa_id: empresa.id,
          empresa_nome: empresa.nome,
          portal_config_id: config.id,
          tipo_certidao: tipo,
          acao: "Busca solicitada manualmente",
          detalhes: `Portal configurado: ${config.url_portal}. Captcha: ${config.tem_captcha ? config.servico_captcha : "não"}`,
          status: "info",
          iniciada_por_email: user?.email || "",
          iniciada_por_nome: user?.full_name || "",
        });

        // Marca a certidão correspondente como "processando"
        const certidoes = await base44.entities.Certidao.filter({ empresa_id: empresa.id, tipo });
        if (certidoes.length > 0) {
          await base44.entities.Certidao.update(certidoes[0].id, { status: "processando" });
        } else {
          await base44.entities.Certidao.create({
            empresa_id: empresa.id,
            empresa_nome: empresa.nome,
            empresa_cnpj: empresa.cnpj,
            tipo,
            subtipo: config.subtipo || "",
            status: "processando",
          });
        }
      }
    }

    setSolicitando(false);
    onSolicitado();
  };

  const tiposComAviso = selecionados.filter(k => !getConfig(k));
  const tiposSemConfigNaoPadrao = tiposComAviso.filter(k => !TIPOS.find(t => t.key === k)?.padrao);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Solicitar Busca de Certidões</h2>
            <p className="text-xs text-gray-500 mt-0.5">{empresa.nome} — {empresa.cnpj}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-600">Selecione os tipos de certidão a buscar:</p>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            TIPOS.map(tipo => {
              const config = getConfig(tipo.key);
              const selecionado = selecionados.includes(tipo.key);
              const semConfig = !config;

              return (
                <button
                  key={tipo.key}
                  onClick={() => toggleTipo(tipo.key)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all ${
                    selecionado
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      selecionado ? "bg-blue-600 border-blue-600" : "border-gray-300"
                    }`}>
                      {selecionado && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tipo.label}</p>
                      <p className="text-xs text-gray-500">{tipo.descricao}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {config ? (
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                        Configurado
                      </span>
                    ) : tipo.padrao ? (
                      <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Info className="w-3 h-3" /> URL Padrão
                      </span>
                    ) : (
                      <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Sem config
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}

          {/* Avisos para tipos selecionados sem config */}
          {tiposComAviso.length > 0 && (
            <div className="mt-2 space-y-2">
              {tiposSemConfigNaoPadrao.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800">
                    <strong>Atenção:</strong> Os tipos <strong>{tiposSemConfigNaoPadrao.map(k => TIPOS.find(t => t.key === k)?.label).join(", ")}</strong> não possuem portal configurado. A busca será registrada como aviso e <strong>não poderá ser realizada</strong> automaticamente.
                  </p>
                </div>
              )}
              {tiposComAviso.filter(k => TIPOS.find(t => t.key === k)?.padrao).length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800">
                    Os tipos <strong>{tiposComAviso.filter(k => TIPOS.find(t => t.key === k)?.padrao).map(k => TIPOS.find(t => t.key === k)?.label).join(", ")}</strong> usarão URL padrão, porém configurações como CAPTCHA e periodicidade não estão definidas.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleSolicitar}
            disabled={selecionados.length === 0 || solicitando || loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            {solicitando ? "Solicitando..." : `Buscar (${selecionados.length} selecionado${selecionados.length !== 1 ? "s" : ""})`}
          </button>
        </div>
      </div>
    </div>
  );
}