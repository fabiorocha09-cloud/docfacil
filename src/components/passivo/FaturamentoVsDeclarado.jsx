import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Loader2, TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);
const fmtPct = (v) => `${(v || 0).toFixed(1)}%`;

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

function calcularStatusPgdas(pgdas, nfe, dimp_total) {
  if (!pgdas && pgdas !== 0) return "sem_dados";
  if (pgdas === 0) return "omisso";
  const maiorFonte = Math.max(nfe || 0, dimp_total || 0);
  if (maiorFonte === 0) return "sem_dados";
  // PGDAS deve ser >= maior fonte de receita identificada
  if (pgdas >= maiorFonte) return "consistente";
  return "inconsistente";
}

function calcularScore(passivo, divergencia, status_pgdas) {
  let score = 0;
  // Score base pelo passivo
  if (passivo > 100000) score += 35;
  else if (passivo > 10000) score += 20;
  else if (passivo > 0) score += 5;
  // Score pela divergência PGDAS
  if (status_pgdas === "omisso") score += 40;
  else if (status_pgdas === "inconsistente") score += 30;
  // Score pela divergência percentual
  if (divergencia > 30) score += 25;
  else if (divergencia > 15) score += 15;
  else if (divergencia > 5) score += 5;
  return Math.min(100, score);
}

const STATUS_CONFIG = {
  consistente: { label: "Consistente", color: "#1E9B5B", bg: "rgba(30,155,91,0.12)", border: "rgba(30,155,91,0.25)" },
  inconsistente: { label: "Inconsistente", color: "#E63946", bg: "rgba(230,57,70,0.12)", border: "rgba(230,57,70,0.25)" },
  omisso: { label: "Omisso", color: "#FF9F1C", bg: "rgba(255,159,28,0.12)", border: "rgba(255,159,28,0.25)" },
  sem_dados: { label: "Sem Dados", color: "#6B7FA3", bg: "rgba(107,127,163,0.12)", border: "rgba(107,127,163,0.25)" },
};

export default function FaturamentoVsDeclarado({ empresa, passivos, onAtualizar }) {
  const { toast } = useToast();
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(null);
  const [form, setForm] = useState({
    periodo: new Date().toISOString().slice(0, 7),
    faturamento_nfe: "",
    faturamento_declarado: "",
    dimp_cartao: "",
    dimp_pix: "",
    observacoes: "",
  });

  const handleSalvar = async () => {
    if (!form.periodo || !form.faturamento_declarado) {
      toast({ title: "Preencha o período e o valor do PGDAS (declarado)." });
      return;
    }
    setSalvando(true);

    const nfe = parseFloat(form.faturamento_nfe) || 0;
    const decl = parseFloat(form.faturamento_declarado) || 0;
    const dimp_cartao = parseFloat(form.dimp_cartao) || 0;
    const dimp_pix = parseFloat(form.dimp_pix) || 0;
    const dimp_total = dimp_cartao + dimp_pix;

    // Divergência: compara PGDAS com a maior fonte (NF-e ou DIMP)
    const maiorFonte = Math.max(nfe, dimp_total);
    const divergencia = maiorFonte > 0 ? ((maiorFonte - decl) / maiorFonte) * 100 : 0;
    const status_pgdas = calcularStatusPgdas(decl, nfe, dimp_total);
    const score_risco = calcularScore(0, divergencia, status_pgdas);

    const existente = passivos.find(p => p.periodo === form.periodo);
    const dados = {
      empresa_id: empresa.id,
      empresa_nome: empresa.nome,
      empresa_cnpj: empresa.cnpj,
      periodo: form.periodo,
      regime_tributario: empresa.regime_tributario,
      faturamento_nfe: nfe,
      faturamento_declarado: decl,
      dimp_cartao,
      dimp_pix,
      dimp_total,
      divergencia_percentual: divergencia,
      status_pgdas,
      score_risco,
      observacoes: form.observacoes,
    };

    if (existente) {
      await base44.entities.PassivoTributario.update(existente.id, dados);
    } else {
      await base44.entities.PassivoTributario.create(dados);
    }

    toast({ title: "✅ Dados salvos com sucesso!" });
    setSalvando(false);
    setForm({ periodo: new Date().toISOString().slice(0, 7), faturamento_nfe: "", faturamento_declarado: "", dimp_cartao: "", dimp_pix: "", observacoes: "" });
    onAtualizar();
  };

  const handleDeletar = async (id) => {
    if (!confirm("Remover este registro?")) return;
    setDeletando(id);
    await base44.entities.PassivoTributario.delete(id);
    toast({ title: "🗑️ Registro removido." });
    setDeletando(null);
    onAtualizar();
  };

  const dadosOrdenados = useMemo(() =>
    [...passivos]
      .filter(p => p.faturamento_nfe > 0 || p.faturamento_declarado > 0 || p.dimp_total > 0)
      .sort((a, b) => a.periodo?.localeCompare(b.periodo))
      .slice(-12)
      .map(p => ({
        ...p,
        name: p.periodo?.slice(0, 7) || "",
        dimp_total: p.dimp_total || ((p.dimp_cartao || 0) + (p.dimp_pix || 0)),
        divergencia_pct: p.divergencia_percentual || 0,
      }))
  , [passivos]);

  const totais = useMemo(() => {
    const totalNfe = dadosOrdenados.reduce((s, p) => s + (p.faturamento_nfe || 0), 0);
    const totalDecl = dadosOrdenados.reduce((s, p) => s + (p.faturamento_declarado || 0), 0);
    const totalDimp = dadosOrdenados.reduce((s, p) => s + (p.dimp_total || 0), 0);
    const inconsistentes = dadosOrdenados.filter(p => p.status_pgdas === "inconsistente" || p.status_pgdas === "omisso").length;
    return { totalNfe, totalDecl, totalDimp, inconsistentes };
  }, [dadosOrdenados]);

  // Preview em tempo real
  const preview = useMemo(() => {
    const nfe = parseFloat(form.faturamento_nfe) || 0;
    const decl = parseFloat(form.faturamento_declarado) || 0;
    const dimp_cartao = parseFloat(form.dimp_cartao) || 0;
    const dimp_pix = parseFloat(form.dimp_pix) || 0;
    const dimp_total = dimp_cartao + dimp_pix;
    const maiorFonte = Math.max(nfe, dimp_total);
    const div = maiorFonte > 0 ? ((maiorFonte - decl) / maiorFonte) * 100 : 0;
    const status = calcularStatusPgdas(decl || null, nfe, dimp_total);
    return { nfe, decl, dimp_total, div, status };
  }, [form]);

  const temPreview = form.faturamento_declarado && (form.faturamento_nfe || form.dimp_cartao || form.dimp_pix);

  return (
    <div className="space-y-5">

      {/* KPIs */}
      {dadosOrdenados.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total NF-e", value: fmt(totais.totalNfe), color: "#0B5FFF" },
            { label: "Total PGDAS Declarado", value: fmt(totais.totalDecl), color: "#1E9B5B" },
            { label: "Total DIMP (Cartão+PIX)", value: fmt(totais.totalDimp), color: "#9B59B6" },
            { label: "Meses c/ Risco", value: totais.inconsistentes, color: totais.inconsistentes > 0 ? "#E63946" : "#1E9B5B" },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-4" style={cardStyle}>
              <p className="text-xs mb-1" style={{ color: "#6B7FA3" }}>{k.label}</p>
              <p className="text-lg font-bold" style={{ color: k.color, fontFamily: "'Exo 2', sans-serif" }}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico comparativo */}
      {dadosOrdenados.length > 0 && (
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h3 className="text-sm font-semibold text-white mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
            PGDAS × NF-e × DIMP por Período
          </h3>
          <p className="text-xs mb-4" style={{ color: "#6B7FA3" }}>
            ⚠️ O PGDAS declarado deve ser ≥ NF-e emitidas e ≥ DIMP (Cartão + PIX). Caso contrário, há risco fiscal.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={dadosOrdenados}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#6B7FA3", fontSize: 10 }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#6B7FA3", fontSize: 10 }} />
              <Tooltip
                formatter={(v, n) => [fmt(v), n]}
                contentStyle={{ background: "#0A0D14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                labelStyle={{ color: "#A0B1D4" }} itemStyle={{ color: "#fff" }}
              />
              <Legend wrapperStyle={{ color: "#6B7FA3", fontSize: 11 }} />
              <Bar dataKey="faturamento_nfe" name="NF-e Emitidas" fill="#0B5FFF" opacity={0.8} radius={[3, 3, 0, 0]} />
              <Bar dataKey="dimp_total" name="DIMP (Cartão+PIX)" fill="#9B59B6" opacity={0.8} radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="faturamento_declarado" name="PGDAS Declarado" stroke="#1E9B5B" strokeWidth={2.5} dot={{ r: 4, fill: "#1E9B5B" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela de auditoria por período */}
      {dadosOrdenados.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <ShieldAlert className="w-4 h-4" style={{ color: "#FF9F1C" }} />
            <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>Auditoria de Receitas — Histórico Mensal</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Mês", "NF-e Emitidas", "DIMP Cartão", "DIMP PIX", "PGDAS (Declarado)", "Divergência", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#6B7FA3" }}>{h}</th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {[...dadosOrdenados].reverse().map(p => {
                  const st = STATUS_CONFIG[p.status_pgdas] || STATUS_CONFIG.sem_dados;
                  const maiorFonte = Math.max(p.faturamento_nfe || 0, p.dimp_total || 0);
                  const diff = maiorFonte - (p.faturamento_declarado || 0);
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: p.status_pgdas === "inconsistente" ? "rgba(230,57,70,0.04)" : p.status_pgdas === "omisso" ? "rgba(255,159,28,0.04)" : "transparent" }}>
                      <td className="px-4 py-3 font-semibold text-white">{p.periodo}</td>
                      <td className="px-4 py-3" style={{ color: "#A0B1D4" }}>{fmt(p.faturamento_nfe)}</td>
                      <td className="px-4 py-3" style={{ color: "#A0B1D4" }}>{fmt(p.dimp_cartao)}</td>
                      <td className="px-4 py-3" style={{ color: "#A0B1D4" }}>{fmt(p.dimp_pix)}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: "#1E9B5B" }}>{fmt(p.faturamento_declarado)}</td>
                      <td className="px-4 py-3">
                        {diff > 0 ? (
                          <span className="font-semibold" style={{ color: "#E63946" }}>
                            -{fmt(diff)} ({fmtPct(p.divergencia_pct)})
                          </span>
                        ) : (
                          <span style={{ color: "#1E9B5B" }}>OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeletar(p.id)} disabled={deletando === p.id}
                          className="p-1 rounded" style={{ color: "#6B7FA3" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#E63946"}
                          onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                          {deletando === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Aviso de inconsistências */}
          {totais.inconsistentes > 0 && (
            <div className="mx-5 my-3 flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
              style={{ background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.2)", color: "#E63946" }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Atenção:</strong> {totais.inconsistentes} período(s) com inconsistência — os documentos fiscais (NF-e ou DIMP) relatam um valor acima do faturamento declarado no PGDAS. Para regularizar, realize a retificação do PGDAS incluindo os documentos ausentes.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Formulário de lançamento */}
      <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <div>
          <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Lançar Período
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#6B7FA3" }}>
            Preencha os valores de cada fonte de receita para o período. O sistema irá calcular o status de consistência do PGDAS automaticamente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Período *</label>
            <input type="month" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#0B5FFF" }}>NF-e Emitidas (R$)</label>
            <input type="number" placeholder="0" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              value={form.faturamento_nfe} onChange={e => setForm(f => ({ ...f, faturamento_nfe: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#1E9B5B" }}>PGDAS — Receita Declarada (R$) *</label>
            <input type="number" placeholder="0" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              value={form.faturamento_declarado} onChange={e => setForm(f => ({ ...f, faturamento_declarado: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#9B59B6" }}>DIMP — Cartão (R$)</label>
            <input type="number" placeholder="0" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              value={form.dimp_cartao} onChange={e => setForm(f => ({ ...f, dimp_cartao: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#9B59B6" }}>DIMP — PIX (R$)</label>
            <input type="number" placeholder="0" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              value={form.dimp_pix} onChange={e => setForm(f => ({ ...f, dimp_pix: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Observações</label>
            <input type="text" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              placeholder="Ex: Dados do Extrato Fiscal SEFAZ" value={form.observacoes}
              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
          </div>
        </div>

        {/* Preview de consistência em tempo real */}
        {temPreview && (() => {
          const st = STATUS_CONFIG[preview.status];
          const Icon = preview.status === "consistente" ? CheckCircle2 : AlertTriangle;
          return (
            <div className="flex items-start gap-2 text-xs px-3 py-2.5 rounded-xl"
              style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>
              <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <div>
                <strong>PGDAS: {st.label}</strong>
                {preview.status !== "consistente" && preview.dimp_total > 0 && (
                  <span className="ml-2">· DIMP Total: {fmt(preview.dimp_total)}</span>
                )}
                {preview.status !== "consistente" && preview.nfe > 0 && (
                  <span className="ml-2">· NF-e: {fmt(preview.nfe)}</span>
                )}
                {preview.div > 0 && (
                  <span className="ml-2">· Divergência: <strong>{fmtPct(preview.div)}</strong></span>
                )}
                {preview.status === "inconsistente" && (
                  <p className="mt-1 opacity-90">O PGDAS declarado ({fmt(preview.decl)}) está abaixo da maior fonte de receita identificada. Retificação recomendada.</p>
                )}
              </div>
            </div>
          );
        })()}

        <button onClick={handleSalvar} disabled={salvando}
          className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)" }}>
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {salvando ? "Salvando..." : "Salvar Período"}
        </button>
      </div>

      {dadosOrdenados.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={cardStyle}>
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "#A0B1D4" }} />
          <p className="text-sm" style={{ color: "#6B7FA3" }}>Nenhum dado lançado. Use o formulário acima para começar a auditoria.</p>
        </div>
      )}
    </div>
  );
}