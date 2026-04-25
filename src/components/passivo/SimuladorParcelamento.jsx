import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Calculator, Save, Loader2, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useToast } from "@/components/ui/use-toast";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function SimuladorParcelamento({ empresa, passivos, pendencias }) {
  const { toast } = useToast();
  const passivoTotal = passivos.reduce((s, p) => s + (p.total_passivo || 0), 0);

  const [form, setForm] = useState({
    valorDebito: passivoTotal.toFixed(2),
    entrada: 0,
    parcelas: 12,
    taxa: 1.0,
    tipo: "parcelamento",
    nome: "Simulação de Parcelamento",
  });
  const [salvando, setSalvando] = useState(false);

  const resultado = useMemo(() => {
    const debito = parseFloat(form.valorDebito) || 0;
    const entrada = parseFloat(form.entrada) || 0;
    const saldo = debito - entrada;
    const taxa = parseFloat(form.taxa) / 100;
    const n = parseInt(form.parcelas) || 1;
    let parcela = 0;
    if (taxa > 0) {
      parcela = saldo * (taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1);
    } else {
      parcela = saldo / n;
    }
    const totalPago = entrada + parcela * n;
    const custo = totalPago - debito;
    const economia = debito * 0.2; // estimativa de economia vs multa integral

    const cronograma = Array.from({ length: Math.min(n, 24) }, (_, i) => ({
      parcela: i + 1,
      valor: parcela,
      saldo: Math.max(0, saldo - parcela * (i + 1)),
    }));

    return { parcela, totalPago, custo, economia, cronograma };
  }, [form]);

  const salvarSimulacao = async () => {
    if (!empresa?.id) return;
    setSalvando(true);
    await base44.entities.SimulacaoPassivo.create({
      empresa_id: empresa.id,
      empresa_nome: empresa.nome,
      nome_cenario: form.nome,
      tipo: form.tipo,
      valor_total_debito: parseFloat(form.valorDebito) || 0,
      valor_entrada: parseFloat(form.entrada) || 0,
      numero_parcelas: parseInt(form.parcelas),
      taxa_juros_parcela: parseFloat(form.taxa),
      valor_parcela: resultado.parcela,
      valor_total_pago: resultado.totalPago,
      economia_estimada: resultado.economia,
      status: "rascunho",
    });
    toast({ title: "✅ Simulação salva com sucesso!" });
    setSalvando(false);
  };

  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontFamily: "'Rethink Sans', sans-serif" };
  const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Parâmetros */}
        <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
            <Calculator className="w-4 h-4" style={{ color: "#0B5FFF" }} /> Parâmetros da Simulação
          </h3>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Nome do cenário</label>
            <input className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Tipo</label>
            <select className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              <option value="parcelamento" style={{ background: "#0A0D14" }}>Parcelamento Comum</option>
              <option value="refis" style={{ background: "#0A0D14" }}>REFIS / PERT</option>
              <option value="pagamento_avista" style={{ background: "#0A0D14" }}>Pagamento à Vista</option>
              <option value="darf" style={{ background: "#0A0D14" }}>Geração de DARF</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Valor Total do Débito (R$)</label>
              <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.valorDebito} onChange={e => setForm(f => ({ ...f, valorDebito: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Entrada (R$)</label>
              <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.entrada} onChange={e => setForm(f => ({ ...f, entrada: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Nº de Parcelas</label>
              <input type="number" min={1} max={120} className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.parcelas} onChange={e => setForm(f => ({ ...f, parcelas: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Taxa de Juros (% a.m.)</label>
              <input type="number" step="0.01" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.taxa} onChange={e => setForm(f => ({ ...f, taxa: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
          <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Resultado da Simulação
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Valor da Parcela", value: fmt(resultado.parcela), color: "#0B5FFF" },
              { label: "Total a Pagar", value: fmt(resultado.totalPago), color: "#E63946" },
              { label: "Custo Financeiro", value: fmt(resultado.custo), color: "#FF9F1C" },
              { label: "Economia Estimada", value: fmt(resultado.economia), color: "#1E9B5B" },
            ].map(k => (
              <div key={k.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs mb-1" style={{ color: "#6B7FA3" }}>{k.label}</p>
                <p className="text-lg font-bold" style={{ color: k.color, fontFamily: "'Exo 2', sans-serif" }}>{k.value}</p>
              </div>
            ))}
          </div>
          <button onClick={salvarSimulacao} disabled={salvando || !empresa?.id}
            className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)" }}>
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {salvando ? "Salvando..." : "Salvar Simulação"}
          </button>
        </div>
      </div>

      {/* Cronograma */}
      {resultado.cronograma.length > 0 && (
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Cronograma de Pagamentos {resultado.cronograma.length < parseInt(form.parcelas) ? `(${resultado.cronograma.length} de ${form.parcelas} parcelas)` : ""}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={resultado.cronograma}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="parcela" tick={{ fill: "#6B7FA3", fontSize: 10 }} label={{ value: "Parcela", position: "insideBottom", fill: "#6B7FA3", fontSize: 10 }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} tick={{ fill: "#6B7FA3", fontSize: 10 }} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "#0A0D14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Bar dataKey="valor" radius={[3, 3, 0, 0]} name="Valor Parcela">
                {resultado.cronograma.map((entry, i) => (
                  <Cell key={i} fill={i === 0 ? "#1E9B5B" : "#0B5FFF"} opacity={1 - i * 0.01} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}