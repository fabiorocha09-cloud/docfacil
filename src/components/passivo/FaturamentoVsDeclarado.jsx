import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);
const fmtPct = (v) => `${(v || 0).toFixed(1)}%`;

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

export default function FaturamentoVsDeclarado({ empresa, passivos, onAtualizar }) {
  const { toast } = useToast();
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(null);
  const [form, setForm] = useState({
    periodo: new Date().toISOString().slice(0, 7),
    faturamento_nfe: "",
    faturamento_declarado: "",
    observacoes: "",
  });

  const handleSalvar = async () => {
    if (!form.periodo || !form.faturamento_nfe || !form.faturamento_declarado) {
      toast({ title: "Preencha todos os campos obrigatórios." });
      return;
    }
    setSalvando(true);
    const nfe = parseFloat(form.faturamento_nfe) || 0;
    const decl = parseFloat(form.faturamento_declarado) || 0;
    const divergencia = nfe > 0 ? ((nfe - decl) / nfe) * 100 : 0;

    // Verifica se já existe registro para esse período
    const existente = passivos.find(p => p.periodo === form.periodo);
    const dados = {
      empresa_id: empresa.id,
      empresa_nome: empresa.nome,
      empresa_cnpj: empresa.cnpj,
      periodo: form.periodo,
      regime_tributario: empresa.regime_tributario,
      faturamento_nfe: nfe,
      faturamento_declarado: decl,
      divergencia_percentual: divergencia,
      observacoes: form.observacoes,
    };

    if (existente) {
      await base44.entities.PassivoTributario.update(existente.id, dados);
    } else {
      await base44.entities.PassivoTributario.create(dados);
    }

    toast({ title: "✅ Dados salvos com sucesso!" });
    setSalvando(false);
    setForm({ periodo: new Date().toISOString().slice(0, 7), faturamento_nfe: "", faturamento_declarado: "", observacoes: "" });
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
      .filter(p => p.faturamento_nfe > 0 || p.faturamento_declarado > 0)
      .sort((a, b) => a.periodo?.localeCompare(b.periodo))
      .slice(-12)
      .map(p => ({
        ...p,
        name: p.periodo?.slice(0, 7) || "",
        divergencia_pct: p.divergencia_percentual || 0,
        diferenca: Math.abs((p.faturamento_nfe || 0) - (p.faturamento_declarado || 0)),
      }))
  , [passivos]);

  const totais = useMemo(() => {
    const totalNfe = dadosOrdenados.reduce((s, p) => s + (p.faturamento_nfe || 0), 0);
    const totalDecl = dadosOrdenados.reduce((s, p) => s + (p.faturamento_declarado || 0), 0);
    const divMedia = dadosOrdenados.length > 0
      ? dadosOrdenados.reduce((s, p) => s + (p.divergencia_percentual || 0), 0) / dadosOrdenados.length
      : 0;
    const totalDiff = Math.abs(totalNfe - totalDecl);
    return { totalNfe, totalDecl, divMedia, totalDiff };
  }, [dadosOrdenados]);

  return (
    <div className="space-y-5">

      {/* KPIs */}
      {dadosOrdenados.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total NF-e Emitidas", value: fmt(totais.totalNfe), color: "#0B5FFF" },
            { label: "Total Declarado", value: fmt(totais.totalDecl), color: "#1E9B5B" },
            { label: "Divergência Média", value: fmtPct(totais.divMedia), color: totais.divMedia > 10 ? "#E63946" : "#1E9B5B" },
            { label: "Diferença Acumulada", value: fmt(totais.totalDiff), color: "#FF9F1C" },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-4" style={cardStyle}>
              <p className="text-xs mb-1" style={{ color: "#6B7FA3" }}>{k.label}</p>
              <p className="text-lg font-bold" style={{ color: k.color, fontFamily: "'Exo 2', sans-serif" }}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico NF-e vs Declarado */}
      {dadosOrdenados.length > 0 && (
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
            NF-e Emitidas vs Declarado
          </h3>
          <ResponsiveContainer width="100%" height={240}>
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
              <Line type="monotone" dataKey="faturamento_declarado" name="Declarado" stroke="#FF9F1C" strokeWidth={2} dot={{ r: 3, fill: "#FF9F1C" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de Divergência */}
      {dadosOrdenados.length > 0 && (
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Divergência (%) por Período
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dadosOrdenados}>
              <defs>
                <linearGradient id="divGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E63946" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#6B7FA3", fontSize: 10 }} />
              <YAxis tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fill: "#6B7FA3", fontSize: 10 }} />
              <Tooltip
                formatter={(v) => [`${v.toFixed(1)}%`, "Divergência"]}
                contentStyle={{ background: "#0A0D14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                labelStyle={{ color: "#A0B1D4" }} itemStyle={{ color: "#fff" }}
              />
              <Area type="monotone" dataKey="divergencia_pct" stroke="#E63946" fill="url(#divGrad)" strokeWidth={2} name="Divergência %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Formulário de entrada manual */}
      <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Lançar Período
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Período *</label>
            <input type="month" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Faturamento NF-e (R$) *</label>
            <input type="number" placeholder="0,00" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              value={form.faturamento_nfe} onChange={e => setForm(f => ({ ...f, faturamento_nfe: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Faturamento Declarado (R$) *</label>
            <input type="number" placeholder="0,00" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              value={form.faturamento_declarado} onChange={e => setForm(f => ({ ...f, faturamento_declarado: e.target.value }))} />
          </div>
        </div>

        {/* Preview da divergência */}
        {form.faturamento_nfe && form.faturamento_declarado && (() => {
          const nfe = parseFloat(form.faturamento_nfe) || 0;
          const decl = parseFloat(form.faturamento_declarado) || 0;
          const div = nfe > 0 ? ((nfe - decl) / nfe) * 100 : 0;
          return (
            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
              style={{ background: div > 10 ? "rgba(230,57,70,0.08)" : "rgba(30,155,91,0.08)", border: `1px solid ${div > 10 ? "rgba(230,57,70,0.2)" : "rgba(30,155,91,0.2)"}`, color: div > 10 ? "#E63946" : "#1E9B5B" }}>
              {div > 10 ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Divergência calculada: <strong>{div.toFixed(1)}%</strong>
              &nbsp;· Diferença: <strong>{fmt(Math.abs(nfe - decl))}</strong>
            </div>
          );
        })()}

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Observações</label>
          <input type="text" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
            placeholder="Ex: NF-e de vendas + serviços" value={form.observacoes}
            onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
        </div>

        <button onClick={handleSalvar} disabled={salvando}
          className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)" }}>
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {salvando ? "Salvando..." : "Salvar Período"}
        </button>
      </div>

      {/* Tabela de registros */}
      {dadosOrdenados.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>Histórico de Lançamentos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Período", "NF-e Emitidas", "Declarado", "Diferença", "Divergência", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "#6B7FA3" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...dadosOrdenados].reverse().map(p => {
                  const diff = (p.faturamento_nfe || 0) - (p.faturamento_declarado || 0);
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-4 py-3 font-medium text-white">{p.periodo}</td>
                      <td className="px-4 py-3" style={{ color: "#A0B1D4" }}>{fmt(p.faturamento_nfe)}</td>
                      <td className="px-4 py-3" style={{ color: "#A0B1D4" }}>{fmt(p.faturamento_declarado)}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: diff > 0 ? "#E63946" : "#1E9B5B" }}>
                        {diff > 0 ? "+" : ""}{fmt(diff)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            background: p.divergencia_pct > 10 ? "rgba(230,57,70,0.12)" : "rgba(30,155,91,0.12)",
                            color: p.divergencia_pct > 10 ? "#E63946" : "#1E9B5B",
                          }}>
                          {fmtPct(p.divergencia_pct)}
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
        </div>
      )}

      {dadosOrdenados.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={cardStyle}>
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "#A0B1D4" }} />
          <p className="text-sm" style={{ color: "#6B7FA3" }}>Nenhum dado lançado ainda. Use o formulário acima para começar.</p>
        </div>
      )}
    </div>
  );
}