import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Loader2, AlertTriangle, CheckCircle2, TrendingDown, ExternalLink, FileText, Building2 } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };

const DESCONTOS = [10, 20, 30, 40, 50, 60, 70];

function formatCNPJ(v) {
  const n = v.replace(/\D/g, '').slice(0, 14);
  if (n.length <= 2) return n;
  if (n.length <= 5) return `${n.slice(0,2)}.${n.slice(2)}`;
  if (n.length <= 8) return `${n.slice(0,2)}.${n.slice(2,5)}.${n.slice(5)}`;
  if (n.length <= 12) return `${n.slice(0,2)}.${n.slice(2,5)}.${n.slice(5,8)}/${n.slice(8)}`;
  return `${n.slice(0,2)}.${n.slice(2,5)}.${n.slice(5,8)}/${n.slice(8,12)}-${n.slice(12)}`;
}

export default function ConsultaNaoCliente() {
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [descontoSelecionado, setDescontoSelecionado] = useState(70);

  const handleConsultar = async () => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      setErro("Informe um CNPJ válido com 14 dígitos.");
      return;
    }
    setLoading(true);
    setErro("");
    setResultado(null);

    const res = await base44.functions.invoke("consultarPGFN", {
      cnpj: cnpjLimpo,
      salvar: false,
    });

    setLoading(false);
    if (res.data?.sucesso) {
      setResultado(res.data);
    } else {
      setErro(res.data?.error || "Erro ao consultar. Tente novamente.");
    }
  };

  const valorComDesconto = resultado
    ? resultado.valor_divida_total * (1 - descontoSelecionado / 100)
    : 0;
  const economia = resultado ? resultado.valor_divida_total - valorComDesconto : 0;

  return (
    <div className="space-y-5">

      {/* Campo de consulta */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Consultar Não Cliente na PGFN
        </h3>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#A0B1D4" }}>CNPJ da Empresa</label>
            <input
              value={cnpj}
              onChange={e => setCnpj(formatCNPJ(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && handleConsultar()}
              placeholder="00.000.000/0000-00"
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none font-mono"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleConsultar}
              disabled={loading}
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)", color: "#fff" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "Consultando..." : "Consultar PGFN"}
            </button>
          </div>
        </div>
        {erro && (
          <div className="flex items-center gap-2 mt-3 text-xs px-3 py-2 rounded-lg"
            style={{ background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.2)", color: "#E63946" }}>
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {erro}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 mt-4 text-sm" style={{ color: "#6B7FA3" }}>
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span>Consultando a lista de devedores da PGFN... isso pode levar alguns segundos.</span>
          </div>
        )}
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="space-y-4">
          {/* Card do resultado */}
          <div className={`rounded-2xl p-5 ${resultado.situacao === 'devedor' ? '' : ''}`}
            style={{
              background: resultado.situacao === 'devedor' ? "rgba(230,57,70,0.06)" : "rgba(30,155,91,0.06)",
              border: resultado.situacao === 'devedor' ? "1px solid rgba(230,57,70,0.25)" : "1px solid rgba(30,155,91,0.25)",
            }}>
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-48">
                <div className="flex items-center gap-2 mb-2">
                  {resultado.situacao === 'devedor'
                    ? <AlertTriangle className="w-5 h-5" style={{ color: "#E63946" }} />
                    : <CheckCircle2 className="w-5 h-5" style={{ color: "#1E9B5B" }} />
                  }
                  <span className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: resultado.situacao === 'devedor' ? "#E63946" : "#1E9B5B" }}>
                    {resultado.situacao === 'devedor' ? "Consta na Lista de Devedores" : "Não Consta na Lista"}
                  </span>
                </div>
                <p className="text-white font-bold text-lg" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {resultado.empresa_nome || "Empresa não identificada"}
                </p>
                <p className="text-xs mt-1 font-mono" style={{ color: "#6B7FA3" }}>
                  CNPJ: {resultado.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                </p>
              </div>
              {resultado.situacao === 'devedor' && (
                <div className="text-right">
                  <p className="text-xs mb-1" style={{ color: "#6B7FA3" }}>Dívida Total na PGFN</p>
                  <p className="text-2xl font-bold" style={{ color: "#E63946", fontFamily: "'Exo 2', sans-serif" }}>
                    {fmt(resultado.valor_divida_total)}
                  </p>
                </div>
              )}
            </div>

            {resultado.observacao && (
              <p className="text-xs mt-3 leading-relaxed" style={{ color: "#A0B1D4" }}>
                📋 {resultado.observacao}
              </p>
            )}

            <a href={`https://www.listadevedores.pgfn.gov.br/?cnpj=${resultado.cnpj}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs mt-3 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.06)", color: "#A0B1D4", border: "1px solid rgba(255,255,255,0.1)" }}>
              <ExternalLink className="w-3 h-3" /> Verificar diretamente no portal PGFN
            </a>
          </div>

          {/* Proposta de Negociação */}
          {resultado.situacao === 'devedor' && resultado.valor_divida_total > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "rgba(11,95,255,0.05)", border: "1px solid rgba(11,95,255,0.2)" }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4" style={{ color: "#5E9BFF" }} />
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Proposta de Negociação — Regularização PGFN
                </h3>
              </div>

              <p className="text-xs mb-4" style={{ color: "#6B7FA3" }}>
                Selecione o percentual de desconto para gerar a proposta de regularização:
              </p>

              {/* Seletor de desconto */}
              <div className="flex gap-2 flex-wrap mb-5">
                {DESCONTOS.map(d => (
                  <button key={d} onClick={() => setDescontoSelecionado(d)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: descontoSelecionado === d ? "rgba(11,95,255,0.3)" : "rgba(255,255,255,0.06)",
                      border: descontoSelecionado === d ? "1px solid rgba(11,95,255,0.6)" : "1px solid rgba(255,255,255,0.1)",
                      color: descontoSelecionado === d ? "#5E9BFF" : "#A0B1D4",
                    }}>
                    {d}% desconto
                  </button>
                ))}
              </div>

              {/* Cards da proposta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl p-4 text-center" style={{ background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.2)" }}>
                  <p className="text-xs mb-1" style={{ color: "#A0B1D4" }}>Dívida Original</p>
                  <p className="text-lg font-bold" style={{ color: "#E63946", fontFamily: "'Exo 2', sans-serif" }}>
                    {fmt(resultado.valor_divida_total)}
                  </p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: "rgba(30,155,91,0.08)", border: "1px solid rgba(30,155,91,0.2)" }}>
                  <p className="text-xs mb-1" style={{ color: "#A0B1D4" }}>Valor com {descontoSelecionado}% Desconto</p>
                  <p className="text-lg font-bold" style={{ color: "#1E9B5B", fontFamily: "'Exo 2', sans-serif" }}>
                    {fmt(valorComDesconto)}
                  </p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: "rgba(11,95,255,0.08)", border: "1px solid rgba(11,95,255,0.2)" }}>
                  <p className="text-xs mb-1" style={{ color: "#A0B1D4" }}>Economia Gerada</p>
                  <p className="text-lg font-bold" style={{ color: "#5E9BFF", fontFamily: "'Exo 2', sans-serif" }}>
                    {fmt(economia)}
                  </p>
                </div>
              </div>

              {/* Texto da proposta */}
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-xs font-semibold mb-2 text-white">Resumo da Proposta</p>
                <p className="text-xs leading-relaxed" style={{ color: "#A0B1D4" }}>
                  A empresa <strong className="text-white">{resultado.empresa_nome}</strong> (CNPJ: {resultado.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}) 
                  possui dívida inscrita na PGFN no valor de <strong className="text-white">{fmt(resultado.valor_divida_total)}</strong>.
                  <br /><br />
                  Através do programa de regularização PGFN, é possível negociar essa dívida com 
                  <strong className="text-white"> {descontoSelecionado}% de desconto</strong>, resultando em um pagamento de 
                  apenas <strong style={{ color: "#1E9B5B" }}>{fmt(valorComDesconto)}</strong>, 
                  gerando uma economia de <strong style={{ color: "#5E9BFF" }}>{fmt(economia)}</strong>.
                </p>
              </div>

              <div className="flex gap-3 mt-4 flex-wrap">
                <a href="https://www.regularize.pgfn.gov.br/" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl"
                  style={{ background: "linear-gradient(135deg,#1E9B5B,#147a47)", color: "#fff" }}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  Regularizar no REGULARIZE
                </a>
                <button
                  onClick={() => {
                    const texto = `PROPOSTA DE REGULARIZAÇÃO FISCAL — PGFN\n\nEmpresa: ${resultado.empresa_nome}\nCNPJ: ${resultado.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}\n\nDívida Total: ${fmt(resultado.valor_divida_total)}\nDesconto Proposto: ${descontoSelecionado}%\nValor com Desconto: ${fmt(valorComDesconto)}\nEconomia: ${fmt(economia)}\n\nData da consulta: ${new Date().toLocaleDateString('pt-BR')}`;
                    navigator.clipboard.writeText(texto);
                  }}
                  className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl"
                  style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#A0B1D4", background: "rgba(255,255,255,0.04)" }}>
                  <FileText className="w-3.5 h-3.5" />
                  Copiar Proposta
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}