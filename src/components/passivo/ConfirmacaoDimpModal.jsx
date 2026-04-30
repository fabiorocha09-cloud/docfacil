import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { X, CheckCircle2, AlertTriangle, Plus, Minus, Loader2, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const fmt = (v) =>
  v !== null && v !== undefined
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
    : "—";

const SITUACAO_CONFIG = {
  igual:        { label: "Igual",          color: "#1E9B5B", bg: "rgba(30,155,91,0.08)",   border: "rgba(30,155,91,0.2)" },
  divergente:   { label: "Divergente",     color: "#E63946", bg: "rgba(230,57,70,0.08)",   border: "rgba(230,57,70,0.25)" },
  novo:         { label: "Novo dado",      color: "#FF9F1C", bg: "rgba(255,159,28,0.08)",  border: "rgba(255,159,28,0.25)" },
  sem_dado_pdf: { label: "Sem dado no PDF",color: "#6B7FA3", bg: "rgba(107,127,163,0.06)", border: "rgba(107,127,163,0.15)" },
};

function calcularStatusPgdas(saida, dimp, pgdas) {
  if (!pgdas && pgdas !== 0) return "sem_dados";
  if (pgdas === 0) return "omisso";
  const maiorFonte = Math.max(saida || 0, dimp || 0);
  if (maiorFonte === 0) return "sem_dados";
  return pgdas >= maiorFonte ? "consistente" : "inconsistente";
}

function calcularScore(divergencia, status_pgdas) {
  let score = 0;
  if (status_pgdas === "omisso") score += 40;
  else if (status_pgdas === "inconsistente") score += 30;
  if (divergencia > 30) score += 25;
  else if (divergencia > 15) score += 15;
  else if (divergencia > 5) score += 5;
  return Math.min(100, score);
}

export default function ConfirmacaoDimpModal({ comparacao, anoBase, empresa, pdfUrl, onClose, onSalvo }) {
  const { toast } = useToast();

  // Estado: para cada mês, cada campo tem um valor "aceito" e se está selecionado para salvar
  const [selecoes, setSelecoes] = useState(() => {
    const init = {};
    comparacao.forEach(mes => {
      init[mes.periodo] = {
        incluir: mes.temDivergencia || mes.isNovo, // auto-seleciona meses com divergência ou novos
        campos: {}
      };
      mes.campos.forEach(c => {
        // Para divergentes e novos, o padrão é usar o valor do PDF (mas o usuário pode mudar)
        init[mes.periodo].campos[c.campo] = {
          usar: c.situacao === "divergente" || c.situacao === "novo",
          valorEscolhido: c.valorPdf ?? c.valorExistente,
        };
      });
    });
    return init;
  });

  const [salvando, setSalvando] = useState(false);

  const toggleMes = (periodo) => {
    setSelecoes(s => ({ ...s, [periodo]: { ...s[periodo], incluir: !s[periodo].incluir } }));
  };

  const toggleCampo = (periodo, campo) => {
    setSelecoes(s => ({
      ...s,
      [periodo]: {
        ...s[periodo],
        campos: {
          ...s[periodo].campos,
          [campo]: {
            ...s[periodo].campos[campo],
            usar: !s[periodo].campos[campo].usar,
          }
        }
      }
    }));
  };

  const setValorManual = (periodo, campo, valor) => {
    setSelecoes(s => ({
      ...s,
      [periodo]: {
        ...s[periodo],
        campos: {
          ...s[periodo].campos,
          [campo]: { ...s[periodo].campos[campo], valorEscolhido: parseFloat(valor) || 0 }
        }
      }
    }));
  };

  const mesesParaSalvar = useMemo(() =>
    comparacao.filter(m => selecoes[m.periodo]?.incluir),
    [comparacao, selecoes]
  );

  const handleSalvar = async () => {
    if (mesesParaSalvar.length === 0) {
      toast({ title: "Nenhum mês selecionado para salvar." });
      return;
    }
    setSalvando(true);
    let salvos = 0;

    for (const mes of mesesParaSalvar) {
      const sel = selecoes[mes.periodo];
      const camposAceitos = {};

      mes.campos.forEach(c => {
        const campoSel = sel.campos[c.campo];
        if (campoSel?.usar && campoSel.valorEscolhido !== null && campoSel.valorEscolhido !== undefined) {
          camposAceitos[c.campo] = campoSel.valorEscolhido;
        } else if (!campoSel?.usar && c.valorExistente !== null && c.valorExistente !== undefined) {
          // mantém o valor existente
          camposAceitos[c.campo] = c.valorExistente;
        } else if (c.valorPdf !== null && c.valorPdf !== undefined) {
          camposAceitos[c.campo] = c.valorPdf;
        }
      });

      // Recalcular campos derivados
      const saida = camposAceitos.faturamento_nfe || 0;
      const dimp = camposAceitos.dimp_total || 0;
      const pgdas = camposAceitos.faturamento_declarado || 0;
      const maiorFonte = Math.max(saida, dimp);
      const divergencia = maiorFonte > 0 ? ((maiorFonte - pgdas) / maiorFonte) * 100 : 0;
      const status_pgdas = calcularStatusPgdas(saida, dimp, pgdas);
      const score_risco = calcularScore(divergencia, status_pgdas);

      const dados = {
        empresa_id: empresa.id,
        empresa_nome: empresa.nome,
        empresa_cnpj: empresa.cnpj,
        periodo: mes.periodo,
        regime_tributario: empresa.regime_tributario,
        divergencia_percentual: divergencia,
        status_pgdas,
        score_risco,
        dimp_relatorio_url: pdfUrl,
        ...camposAceitos,
      };

      if (mes.existente_id) {
        await base44.entities.PassivoTributario.update(mes.existente_id, dados);
      } else {
        await base44.entities.PassivoTributario.create(dados);
      }
      salvos++;
    }

    toast({ title: `✅ ${salvos} período(s) salvos com sucesso!` });
    setSalvando(false);
    onSalvo();
  };

  const totalDivergencias = comparacao.filter(m => m.temDivergencia).length;
  const totalNovos = comparacao.filter(m => m.isNovo).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col"
        style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)" }}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div>
            <h2 className="font-bold text-white text-lg" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Confirmação de Importação — DIMP {anoBase}
            </h2>
            <p className="text-xs mt-1" style={{ color: "#6B7FA3" }}>
              Revise os dados extraídos do PDF antes de salvar. Campos em vermelho indicam divergências.
            </p>
            <div className="flex items-center gap-3 mt-2">
              {totalDivergencias > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                  style={{ background: "rgba(230,57,70,0.1)", color: "#E63946", border: "1px solid rgba(230,57,70,0.25)" }}>
                  <AlertTriangle className="w-3 h-3" /> {totalDivergencias} mês(es) com divergência
                </span>
              )}
              {totalNovos > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                  style={{ background: "rgba(255,159,28,0.1)", color: "#FF9F1C", border: "1px solid rgba(255,159,28,0.25)" }}>
                  <Plus className="w-3 h-3" /> {totalNovos} mês(es) novo(s)
                </span>
              )}
              {totalDivergencias === 0 && totalNovos === 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                  style={{ background: "rgba(30,155,91,0.1)", color: "#1E9B5B", border: "1px solid rgba(30,155,91,0.25)" }}>
                  <CheckCircle2 className="w-3 h-3" /> Todos os valores são iguais ao banco
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="flex-shrink-0 ml-4" style={{ color: "#6B7FA3" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {comparacao.map(mes => {
            const sel = selecoes[mes.periodo];
            const isIncluido = sel?.incluir;

            return (
              <div key={mes.periodo}
                className="rounded-xl overflow-hidden"
                style={{
                  border: `1px solid ${mes.temDivergencia ? "rgba(230,57,70,0.25)" : mes.isNovo ? "rgba(255,159,28,0.25)" : "rgba(255,255,255,0.07)"}`,
                  background: mes.temDivergencia ? "rgba(230,57,70,0.03)" : mes.isNovo ? "rgba(255,159,28,0.03)" : "rgba(255,255,255,0.02)",
                }}>

                {/* Cabeçalho do mês */}
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleMes(mes.periodo)}
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        background: isIncluido ? "#0B5FFF" : "rgba(255,255,255,0.08)",
                        border: `1px solid ${isIncluido ? "#0B5FFF" : "rgba(255,255,255,0.15)"}`,
                      }}>
                      {isIncluido && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <div>
                      <span className="font-bold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
                        {mes.mes_nome} / {anoBase}
                      </span>
                      <span className="ml-2 text-xs" style={{ color: "#6B7FA3" }}>({mes.periodo})</span>
                    </div>
                    {mes.isNovo && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,159,28,0.12)", color: "#FF9F1C", border: "1px solid rgba(255,159,28,0.25)" }}>
                        Novo registro
                      </span>
                    )}
                    {mes.temDivergencia && !mes.isNovo && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(230,57,70,0.12)", color: "#E63946", border: "1px solid rgba(230,57,70,0.25)" }}>
                        Divergência encontrada
                      </span>
                    )}
                    {!mes.temDivergencia && !mes.isNovo && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(30,155,91,0.1)", color: "#1E9B5B", border: "1px solid rgba(30,155,91,0.2)" }}>
                        Sem divergências
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: "#6B7FA3" }}>
                    {isIncluido ? "✓ Será salvo" : "Ignorar mês"}
                  </span>
                </div>

                {/* Campos */}
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {mes.campos.map(campo => {
                    const campoSel = sel?.campos[campo.campo];
                    const usarPdf = campoSel?.usar;
                    const situCfg = SITUACAO_CONFIG[campo.situacao];
                    const isDivergente = campo.situacao === "divergente" || campo.situacao === "novo";

                    return (
                      <div key={campo.campo} className="px-4 py-3"
                        style={{ background: isDivergente ? situCfg.bg : "transparent" }}>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          {/* Label + situação */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-medium text-white"
                              style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
                              {campo.label}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: situCfg.bg, color: situCfg.color, border: `1px solid ${situCfg.border}` }}>
                              {situCfg.label}
                            </span>
                          </div>

                          {/* Valores */}
                          <div className="flex items-center gap-4 flex-shrink-0">
                            {/* Valor Existente */}
                            <div className="text-right">
                              <p className="text-xs mb-0.5" style={{ color: "#6B7FA3" }}>Banco atual</p>
                              <p className="text-sm font-semibold"
                                style={{ color: campo.valorExistente !== null ? "#A0B1D4" : "#3B4B6B" }}>
                                {fmt(campo.valorExistente)}
                              </p>
                            </div>

                            {/* Seta */}
                            {isDivergente && (
                              <div className="text-lg" style={{ color: "#3B4B6B" }}>→</div>
                            )}

                            {/* Valor PDF */}
                            {isDivergente && (
                              <div className="text-right">
                                <p className="text-xs mb-0.5" style={{ color: "#6B7FA3" }}>PDF extraído</p>
                                <p className="text-sm font-bold" style={{ color: situCfg.color }}>
                                  {fmt(campo.valorPdf)}
                                </p>
                              </div>
                            )}

                            {/* Ação para campos divergentes/novos */}
                            {isDivergente && isIncluido && (
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  onClick={() => toggleCampo(mes.periodo, campo.campo)}
                                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                                  style={{
                                    background: usarPdf ? situCfg.bg : "rgba(255,255,255,0.06)",
                                    border: `1px solid ${usarPdf ? situCfg.border : "rgba(255,255,255,0.1)"}`,
                                    color: usarPdf ? situCfg.color : "#6B7FA3",
                                  }}>
                                  {usarPdf
                                    ? (campo.situacao === "novo" ? "✓ Incluir" : "✓ Atualizar")
                                    : "Manter atual"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Input de valor manual quando divergente e selecionado */}
                        {isDivergente && isIncluido && usarPdf && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs" style={{ color: "#6B7FA3" }}>Valor a salvar:</span>
                            <input
                              type="number"
                              step="0.01"
                              className="rounded-lg px-2 py-1 text-xs focus:outline-none w-36"
                              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                              value={campoSel?.valorEscolhido ?? campo.valorPdf ?? ""}
                              onChange={e => setValorManual(mes.periodo, campo.campo, e.target.value)}
                            />
                            <span className="text-xs" style={{ color: "#6B7FA3" }}>
                              (editável — confirme ou ajuste antes de salvar)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-5 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs" style={{ color: "#6B7FA3" }}>
            {mesesParaSalvar.length} de {comparacao.length} mês(es) selecionado(s) para salvar
          </p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="text-sm font-medium px-4 py-2 rounded-xl"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}>
              Cancelar
            </button>
            <button onClick={handleSalvar} disabled={salvando || mesesParaSalvar.length === 0}
              className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)" }}>
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {salvando ? "Salvando..." : `Salvar ${mesesParaSalvar.length} período(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}