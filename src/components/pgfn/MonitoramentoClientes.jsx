import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Search, Loader2, AlertTriangle, CheckCircle2, Clock, TrendingDown, Building2, ChevronDown, ChevronUp } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };

function formatCNPJ(v) {
  const n = String(v || '').replace(/\D/g, '');
  if (n.length !== 14) return v;
  return `${n.slice(0,2)}.${n.slice(2,5)}.${n.slice(5,8)}/${n.slice(8,12)}-${n.slice(12)}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function MonitoramentoClientes() {
  const [empresas, setEmpresas] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consultandoId, setConsultandoId] = useState(null);
  const [consultandoLote, setConsultandoLote] = useState(false);
  const [loteProgresso, setLoteProgresso] = useState({ atual: 0, total: 0 });
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState(null);
  const [descontoSelecionado, setDescontoSelecionado] = useState(70);

  const carregar = async () => {
    setLoading(true);
    const [emps, conss] = await Promise.all([
      base44.entities.Empresa.list(),
      base44.entities.ConsultaPGFN.list(),
    ]);
    setEmpresas(emps.filter(e => !e.excluida && e.status !== 'inativo'));
    setConsultas(conss);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const empresasComConsulta = useMemo(() => {
    return empresas
      .filter(e => !busca || e.nome?.toLowerCase().includes(busca.toLowerCase()) || e.cnpj?.includes(busca))
      .map(e => {
        const cnpjLimpo = (e.cnpj || '').replace(/\D/g, '');
        const consulta = consultas.find(c => c.cnpj === cnpjLimpo);
        return { ...e, consulta };
      })
      .sort((a, b) => {
        // Devedores primeiro, depois sem consulta, depois regulares
        if (a.consulta?.situacao === 'devedor' && b.consulta?.situacao !== 'devedor') return -1;
        if (b.consulta?.situacao === 'devedor' && a.consulta?.situacao !== 'devedor') return 1;
        if (!a.consulta && b.consulta) return -1;
        if (a.consulta && !b.consulta) return 1;
        return (b.consulta?.valor_divida_total || 0) - (a.consulta?.valor_divida_total || 0);
      });
  }, [empresas, consultas, busca]);

  const kpis = useMemo(() => {
    const comConsulta = empresas.filter(e => {
      const cnpj = (e.cnpj || '').replace(/\D/g, '');
      return consultas.some(c => c.cnpj === cnpj);
    });
    const devedores = consultas.filter(c => c.situacao === 'devedor');
    const totalDivida = devedores.reduce((s, c) => s + (c.valor_divida_total || 0), 0);
    return { comConsulta: comConsulta.length, devedores: devedores.length, totalDivida, total: empresas.length };
  }, [empresas, consultas]);

  const handleConsultarUm = async (empresa) => {
    const cnpjLimpo = (empresa.cnpj || '').replace(/\D/g, '');
    if (!cnpjLimpo || cnpjLimpo.length !== 14) return;

    setConsultandoId(empresa.id);
    const res = await base44.functions.invoke("consultarPGFN", {
      cnpj: cnpjLimpo,
      salvar: true,
      empresa_id: empresa.id,
      empresa_nome: empresa.nome,
    });
    setConsultandoId(null);
    if (res.data?.sucesso) carregar();
  };

  const handleConsultarLote = async () => {
    const semConsulta = empresasComConsulta.filter(e => !e.consulta);
    const aConsultar = semConsulta.length > 0 ? semConsulta : empresasComConsulta;

    if (!confirm(`Consultar ${aConsultar.length} empresa(s) na PGFN? Isso pode levar alguns minutos.`)) return;

    setConsultandoLote(true);
    setLoteProgresso({ atual: 0, total: aConsultar.length });

    for (let i = 0; i < aConsultar.length; i++) {
      const empresa = aConsultar[i];
      setLoteProgresso({ atual: i + 1, total: aConsultar.length });
      const cnpjLimpo = (empresa.cnpj || '').replace(/\D/g, '');
      if (!cnpjLimpo || cnpjLimpo.length !== 14) continue;
      await base44.functions.invoke("consultarPGFN", {
        cnpj: cnpjLimpo,
        salvar: true,
        empresa_id: empresa.id,
        empresa_nome: empresa.nome,
      });
    }

    setConsultandoLote(false);
    carregar();
  };

  if (loading) return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total de Clientes", value: kpis.total, color: "#A0B1D4" },
          { label: "Com Consulta", value: kpis.comConsulta, color: "#5E9BFF" },
          { label: "Devedores PGFN", value: kpis.devedores, color: kpis.devedores > 0 ? "#E63946" : "#1E9B5B" },
          { label: "Total de Dívidas", value: fmt(kpis.totalDivida), color: "#E63946" },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-4" style={cardStyle}>
            <p className="text-xs mb-1" style={{ color: "#6B7FA3" }}>{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color, fontFamily: "'Exo 2', sans-serif" }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de ações */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-48">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar cliente por nome ou CNPJ..."
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7FA3" }}>
          <span>Desconto padrão:</span>
          {[30, 50, 70].map(d => (
            <button key={d} onClick={() => setDescontoSelecionado(d)}
              className="px-2.5 py-1 rounded-lg font-semibold transition-all"
              style={{
                background: descontoSelecionado === d ? "rgba(11,95,255,0.2)" : "rgba(255,255,255,0.05)",
                border: descontoSelecionado === d ? "1px solid rgba(11,95,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
                color: descontoSelecionado === d ? "#5E9BFF" : "#6B7FA3",
              }}>{d}%</button>
          ))}
        </div>
        <button
          onClick={handleConsultarLote}
          disabled={consultandoLote}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl"
          style={{ background: "rgba(11,95,255,0.15)", color: "#5E9BFF", border: "1px solid rgba(11,95,255,0.3)" }}>
          {consultandoLote
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {loteProgresso.atual}/{loteProgresso.total}</>
            : <><RefreshCw className="w-3.5 h-3.5" /> Consultar em Lote</>
          }
        </button>
        <button onClick={carregar} className="p-2 rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#6B7FA3" }}>
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {consultandoLote && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs"
          style={{ background: "rgba(11,95,255,0.06)", border: "1px solid rgba(11,95,255,0.2)", color: "#5E9BFF" }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Consultando empresa {loteProgresso.atual} de {loteProgresso.total}... Aguarde, este processo pode demorar alguns minutos.
        </div>
      )}

      {/* Lista de empresas */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Empresa", "CNPJ", "Situação PGFN", "Dívida Total", "Proposta ("+descontoSelecionado+"%)", "Última Consulta", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#6B7FA3" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empresasComConsulta.map(empresa => {
                const consulta = empresa.consulta;
                const temDivida = consulta?.situacao === 'devedor' && (consulta?.valor_divida_total || 0) > 0;
                const valorProposta = temDivida ? consulta.valor_divida_total * (1 - descontoSelecionado / 100) : 0;
                const isExpanded = expandido === empresa.id;

                return (
                  <>
                    <tr key={empresa.id}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: temDivida ? "rgba(230,57,70,0.03)" : "transparent" }}>
                      <td className="px-4 py-3 font-medium text-white">{empresa.nome}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: "#A0B1D4" }}>{formatCNPJ(empresa.cnpj)}</td>
                      <td className="px-4 py-3">
                        {!consulta ? (
                          <span className="px-2 py-1 rounded-full text-xs" style={{ background: "rgba(107,127,163,0.1)", color: "#6B7FA3", border: "1px solid rgba(107,127,163,0.2)" }}>
                            Não consultado
                          </span>
                        ) : consulta.situacao === 'devedor' ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(230,57,70,0.12)", color: "#E63946", border: "1px solid rgba(230,57,70,0.25)" }}>
                            ⚠ Devedor
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(30,155,91,0.12)", color: "#1E9B5B", border: "1px solid rgba(30,155,91,0.25)" }}>
                            ✓ Regular
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: temDivida ? "#E63946" : "#6B7FA3" }}>
                        {consulta ? fmt(consulta.valor_divida_total) : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: temDivida ? "#1E9B5B" : "#6B7FA3" }}>
                        {temDivida ? fmt(valorProposta) : "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#6B7FA3" }}>
                        {consulta ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(consulta.data_ultima_consulta)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {temDivida && (
                            <button onClick={() => setExpandido(isExpanded ? null : empresa.id)}
                              className="p-1.5 rounded-lg text-xs" title="Ver proposta"
                              style={{ border: "1px solid rgba(11,95,255,0.3)", color: "#5E9BFF", background: "rgba(11,95,255,0.08)" }}>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleConsultarUm(empresa)}
                            disabled={consultandoId === empresa.id}
                            className="p-1.5 rounded-lg" title="Consultar agora"
                            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4", background: "rgba(255,255,255,0.04)" }}>
                            {consultandoId === empresa.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <RefreshCw className="w-3 h-3" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && temDivida && (
                      <tr key={`prop-${empresa.id}`} style={{ background: "rgba(11,95,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div className="text-center rounded-xl p-3" style={{ background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.15)" }}>
                              <p className="text-xs mb-1" style={{ color: "#A0B1D4" }}>Dívida Original</p>
                              <p className="text-sm font-bold" style={{ color: "#E63946" }}>{fmt(consulta.valor_divida_total)}</p>
                            </div>
                            <div className="text-center rounded-xl p-3" style={{ background: "rgba(30,155,91,0.08)", border: "1px solid rgba(30,155,91,0.15)" }}>
                              <p className="text-xs mb-1" style={{ color: "#A0B1D4" }}>Com {descontoSelecionado}% Desconto</p>
                              <p className="text-sm font-bold" style={{ color: "#1E9B5B" }}>{fmt(valorProposta)}</p>
                            </div>
                            <div className="text-center rounded-xl p-3" style={{ background: "rgba(11,95,255,0.08)", border: "1px solid rgba(11,95,255,0.15)" }}>
                              <p className="text-xs mb-1" style={{ color: "#A0B1D4" }}>Economia</p>
                              <p className="text-sm font-bold" style={{ color: "#5E9BFF" }}>{fmt(consulta.valor_divida_total - valorProposta)}</p>
                            </div>
                          </div>
                          <a href="https://www.regularize.pgfn.gov.br/" target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg"
                            style={{ background: "rgba(30,155,91,0.15)", color: "#1E9B5B", border: "1px solid rgba(30,155,91,0.25)" }}>
                            Regularizar no Portal PGFN →
                          </a>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {empresasComConsulta.length === 0 && (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "#6B7FA3" }}>
            Nenhum cliente encontrado.
          </div>
        )}
      </div>
    </div>
  );
}