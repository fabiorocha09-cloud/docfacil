import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Building2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const situacaoConfig = {
  regular: { label: "Regular", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  bloqueada: { label: "Bloqueada/Vedada", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
  nao_possui: { label: "Não Possui IE", color: "text-gray-500 bg-gray-50 border-gray-200", icon: AlertTriangle },
};

export default function ControleIE() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selecionados, setSelecionados] = useState([]);
  const [consultando, setConsultando] = useState({}); // { [id]: true }
  const [consultandoLote, setConsultandoLote] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const { toast } = useToast();

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    setLoading(true);
    const data = await base44.entities.Empresa.list();
    setEmpresas(data.filter(e => !e.excluida));
    setLoading(false);
  };

  const consultarEmpresa = async (empresa) => {
    setConsultando(prev => ({ ...prev, [empresa.id]: true }));
    try {
      const response = await base44.functions.invoke("consultarCnpj", { cnpj: empresa.cnpj });
      if (response.data?.error) {
        toast({ title: `❌ Erro em ${empresa.nome}`, description: response.data.error });
        setConsultando(prev => ({ ...prev, [empresa.id]: false }));
        return;
      }
      const { inscricao_estadual, situacao_inscricao_estadual } = response.data;
      await base44.entities.Empresa.update(empresa.id, {
        inscricao_estadual: inscricao_estadual || empresa.inscricao_estadual,
        situacao_inscricao_estadual,
        data_atualizacao_ie: new Date().toISOString().slice(0, 10),
      });
      setEmpresas(prev => prev.map(e => e.id === empresa.id ? {
        ...e,
        inscricao_estadual: inscricao_estadual || e.inscricao_estadual,
        situacao_inscricao_estadual,
        data_atualizacao_ie: new Date().toISOString().slice(0, 10),
      } : e));
    } catch (err) {
      toast({ title: `❌ Erro ao consultar ${empresa.nome}` });
    }
    setConsultando(prev => ({ ...prev, [empresa.id]: false }));
  };

  const consultarEmLote = async () => {
    if (selecionados.length === 0) return;
    setConsultandoLote(true);
    const lista = empresas.filter(e => selecionados.includes(e.id));
    for (const empresa of lista) {
      await consultarEmpresa(empresa);
    }
    setSelecionados([]);
    setConsultandoLote(false);
    toast({ title: `✅ Atualização concluída!`, description: `${lista.length} empresa(s) consultada(s).` });
  };

  const filtradas = empresas.filter(e => {
    const matchSearch = e.nome?.toLowerCase().includes(search.toLowerCase()) || e.cnpj?.includes(search);
    const matchFiltro = filtro === "todos" || e.situacao_inscricao_estadual === filtro || (filtro === "nao_atualizado" && !e.situacao_inscricao_estadual);
    return matchSearch && matchFiltro;
  });

  const contadores = {
    total: empresas.length,
    regular: empresas.filter(e => e.situacao_inscricao_estadual === "regular").length,
    bloqueada: empresas.filter(e => e.situacao_inscricao_estadual === "bloqueada").length,
    nao_possui: empresas.filter(e => e.situacao_inscricao_estadual === "nao_possui").length,
    nao_atualizado: empresas.filter(e => !e.situacao_inscricao_estadual).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle de Inscrição Estadual</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Consulte e atualize mensalmente a situação da IE via API do CNPJ
          </p>
        </div>
        {selecionados.length > 0 && (
          <button
            onClick={consultarEmLote}
            disabled={consultandoLote}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {consultandoLote ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {consultandoLote ? "Consultando..." : `Atualizar Selecionadas (${selecionados.length})`}
          </button>
        )}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "regular", label: "Regulares", value: contadores.regular, color: "text-green-600", bg: "bg-green-50 border-green-200" },
          { key: "bloqueada", label: "Bloqueadas", value: contadores.bloqueada, color: "text-red-600", bg: "bg-red-50 border-red-200" },
          { key: "nao_possui", label: "Não Possuem IE", value: contadores.nao_possui, color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
          { key: "nao_atualizado", label: "Não Atualizadas", value: contadores.nao_atualizado, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
        ].map(card => (
          <button
            key={card.key}
            onClick={() => setFiltro(filtro === card.key ? "todos" : card.key)}
            className={`rounded-xl border p-4 text-left transition-all ${card.bg} ${filtro === card.key ? "ring-2 ring-blue-400" : ""}`}
          >
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Busca e filtro */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Buscar por nome ou CNPJ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
        >
          <option value="todos">Todas ({contadores.total})</option>
          <option value="regular">Regulares ({contadores.regular})</option>
          <option value="bloqueada">Bloqueadas ({contadores.bloqueada})</option>
          <option value="nao_possui">Não Possuem IE ({contadores.nao_possui})</option>
          <option value="nao_atualizado">Não Atualizadas ({contadores.nao_atualizado})</option>
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma empresa encontrada.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <span className="text-xs text-gray-500 dark:text-gray-400">{filtradas.length} empresa(s)</span>
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => {
                if (selecionados.length === filtradas.length) setSelecionados([]);
                else setSelecionados(filtradas.map(e => e.id));
              }}
            >
              {selecionados.length === filtradas.length ? "Desmarcar todos" : "Selecionar todos"}
            </button>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtradas.map(empresa => {
              const isSel = selecionados.includes(empresa.id);
              const isConsultando = consultando[empresa.id];
              const sit = empresa.situacao_inscricao_estadual;
              const cfg = sit ? situacaoConfig[sit] : null;
              const SitIcon = cfg?.icon;

              return (
                <div
                  key={empresa.id}
                  className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${isSel ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  onClick={() => setSelecionados(prev => isSel ? prev.filter(id => id !== empresa.id) : [...prev, empresa.id])}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Checkbox */}
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSel ? "bg-blue-600 border-blue-600" : "border-gray-300 dark:border-gray-600"}`}>
                      {isSel && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{empresa.nome}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span>{empresa.cnpj}</span>
                        {empresa.inscricao_estadual && <span>IE: {empresa.inscricao_estadual}</span>}
                        {empresa.data_atualizacao_ie && (
                          <span className="text-gray-400">Atualizado: {new Date(empresa.data_atualizacao_ie).toLocaleDateString("pt-BR")}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4" onClick={e => e.stopPropagation()}>
                    {cfg ? (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                        <SitIcon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </div>
                    ) : (
                      <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">Não consultada</span>
                    )}
                    <button
                      onClick={() => consultarEmpresa(empresa)}
                      disabled={isConsultando || consultandoLote}
                      className="flex items-center gap-1.5 border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {isConsultando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      {isConsultando ? "Consultando..." : "Atualizar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}