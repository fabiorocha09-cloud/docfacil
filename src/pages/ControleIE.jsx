import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const situacaoConfig = {
  regular:    { label: "Regular",         bg: "rgba(34,197,94,0.15)",  color: "#4ade80",  border: "rgba(34,197,94,0.3)",  icon: CheckCircle2 },
  bloqueada:  { label: "Bloqueada/Vedada",bg: "rgba(239,68,68,0.15)",  color: "#f87171",  border: "rgba(239,68,68,0.3)",  icon: XCircle },
  nao_possui: { label: "Não Possui IE",   bg: "rgba(255,255,255,0.07)",color: "#6B7FA3",  border: "rgba(255,255,255,0.1)",icon: AlertTriangle },
};

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

export default function ControleIE() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selecionados, setSelecionados] = useState([]);
  const [consultando, setConsultando] = useState({});
  const [consultandoLote, setConsultandoLote] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const { toast } = useToast();

  useEffect(() => { carregar(); }, []);

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
        toast({ title: `❌ Erro em ${empresa.nome}`, description: response.data.error, duration: 3000 });
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
        ...e, inscricao_estadual: inscricao_estadual || e.inscricao_estadual,
        situacao_inscricao_estadual, data_atualizacao_ie: new Date().toISOString().slice(0, 10),
      } : e));
    } catch {
      toast({ title: `❌ Erro ao consultar ${empresa.nome}`, duration: 3000 });
    }
    setConsultando(prev => ({ ...prev, [empresa.id]: false }));
  };

  const consultarEmLote = async () => {
    if (selecionados.length === 0) return;
    setConsultandoLote(true);
    const lista = empresas.filter(e => selecionados.includes(e.id));
    for (const empresa of lista) await consultarEmpresa(empresa);
    setSelecionados([]);
    setConsultandoLote(false);
    toast({ title: `✅ Atualização concluída!`, description: `${lista.length} empresa(s) consultada(s).`, duration: 3000 });
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

  const summaryCards = [
    { key: "regular",       label: "Regulares",       value: contadores.regular,       bg: "rgba(34,197,94,0.08)",  color: "#4ade80",  border: "rgba(34,197,94,0.2)" },
    { key: "bloqueada",     label: "Bloqueadas",      value: contadores.bloqueada,      bg: "rgba(239,68,68,0.08)",  color: "#f87171",  border: "rgba(239,68,68,0.2)" },
    { key: "nao_possui",    label: "Não Possuem IE",  value: contadores.nao_possui,     bg: "rgba(255,255,255,0.04)",color: "#6B7FA3",  border: "rgba(255,255,255,0.08)" },
    { key: "nao_atualizado",label: "Não Atualizadas", value: contadores.nao_atualizado, bg: "rgba(234,179,8,0.08)",  color: "#fcd34d",  border: "rgba(234,179,8,0.2)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>Controle de Inscrição Estadual</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Consulte e atualize mensalmente a situação da IE via API do CNPJ</p>
        </div>
        {selecionados.length > 0 && (
          <button onClick={consultarEmLote} disabled={consultandoLote}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
            {consultandoLote ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {consultandoLote ? "Consultando..." : `Atualizar Selecionadas (${selecionados.length})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map(card => (
          <button key={card.key} onClick={() => setFiltro(filtro === card.key ? "todos" : card.key)}
            className="rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5"
            style={{ background: card.bg, border: `1px solid ${filtro === card.key ? card.color : card.border}`, boxShadow: filtro === card.key ? `0 0 16px ${card.bg}` : "none" }}>
            <p className="text-2xl font-bold" style={{ color: card.color, fontFamily: "'Manrope', sans-serif" }}>{card.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{card.label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7FA3" }} />
          <input className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }}
            placeholder="Buscar por nome ou CNPJ..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
          style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }}
          value={filtro} onChange={e => setFiltro(e.target.value)}>
          <option value="todos" style={{ background: "#0A0D14" }}>Todas ({contadores.total})</option>
          <option value="regular" style={{ background: "#0A0D14" }}>Regulares ({contadores.regular})</option>
          <option value="bloqueada" style={{ background: "#0A0D14" }}>Bloqueadas ({contadores.bloqueada})</option>
          <option value="nao_possui" style={{ background: "#0A0D14" }}>Não Possuem IE ({contadores.nao_possui})</option>
          <option value="nao_atualizado" style={{ background: "#0A0D14" }}>Não Atualizadas ({contadores.nao_atualizado})</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}</div>
      ) : filtradas.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={cardStyle}>
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#A0B1D4" }} />
          <p style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Nenhuma empresa encontrada.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{filtradas.length} empresa(s)</span>
            <button className="text-xs font-medium" style={{ color: "#5E9BFF", fontFamily: "'Rethink Sans', sans-serif" }}
              onClick={() => { if (selecionados.length === filtradas.length) setSelecionados([]); else setSelecionados(filtradas.map(e => e.id)); }}>
              {selecionados.length === filtradas.length ? "Desmarcar todos" : "Selecionar todos"}
            </button>
          </div>
          <div>
            {filtradas.map(empresa => {
              const isSel = selecionados.includes(empresa.id);
              const isConsultando = consultando[empresa.id];
              const sit = empresa.situacao_inscricao_estadual;
              const cfg = sit ? situacaoConfig[sit] : null;
              const SitIcon = cfg?.icon;
              return (
                <div key={empresa.id}
                  className="flex items-center justify-between px-5 py-4 cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: isSel ? "rgba(58,141,255,0.06)" : "transparent" }}
                  onClick={() => setSelecionados(prev => isSel ? prev.filter(id => id !== empresa.id) : [...prev, empresa.id])}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                      style={{ background: isSel ? "#3A8DFF" : "transparent", borderColor: isSel ? "#3A8DFF" : "rgba(255,255,255,0.2)" }}>
                      {isSel && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate" style={{ fontFamily: "'Manrope', sans-serif" }}>{empresa.nome}</p>
                      <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>
                        <span>{empresa.cnpj}</span>
                        {empresa.inscricao_estadual && <span>IE: {empresa.inscricao_estadual}</span>}
                        {empresa.data_atualizacao_ie && <span>Atualizado: {new Date(empresa.data_atualizacao_ie).toLocaleDateString("pt-BR")}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4" onClick={e => e.stopPropagation()}>
                    {cfg ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontFamily: "'Outfit', sans-serif" }}>
                        <SitIcon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </div>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(234,179,8,0.12)", color: "#fcd34d", border: "1px solid rgba(234,179,8,0.3)", fontFamily: "'Outfit', sans-serif" }}>Não consultada</span>
                    )}
                    <button onClick={() => consultarEmpresa(empresa)} disabled={isConsultando || consultandoLote}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                      style={{ border: "1px solid rgba(58,141,255,0.3)", color: "#5E9BFF", background: "rgba(58,141,255,0.08)" }}>
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