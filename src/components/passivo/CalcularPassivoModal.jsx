import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Calculator, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const REGIMES = {
  simples_nacional: { pis: 0.65, cofins: 3, irpj: 0, csll: 0 },
  lucro_presumido: { pis: 0.65, cofins: 3, irpj: 4.8, csll: 2.88 },
  lucro_real: { pis: 1.65, cofins: 7.6, irpj: 15, csll: 9 },
  mei: { pis: 0, cofins: 0, irpj: 0, csll: 0 },
};

export default function CalcularPassivoModal({ empresa, onClose, onSalvo }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    periodo: new Date().toISOString().slice(0, 7),
    faturamento_nfe: 0,
    faturamento_declarado: 0,
    icms_devido: 0,
    icms_pago: 0,
    iss_devido: 0,
    iss_pago: 0,
    inss_devido: 0,
    inss_pago: 0,
    observacoes: "",
  });
  const [salvando, setSalvando] = useState(false);

  const regime = empresa?.regime_tributario || "simples_nacional";
  const aliq = REGIMES[regime] || REGIMES.simples_nacional;

  const fat = parseFloat(form.faturamento_nfe) || 0;
  const decl = parseFloat(form.faturamento_declarado) || 0;
  const divergencia = fat > 0 ? ((fat - decl) / fat) * 100 : 0;

  const pis_devido = fat * (aliq.pis / 100);
  const cofins_devido = fat * (aliq.cofins / 100);
  const irpj_devido = fat * (aliq.irpj / 100);
  const csll_devido = fat * (aliq.csll / 100);
  const icms_devido = parseFloat(form.icms_devido) || 0;
  const iss_devido = parseFloat(form.iss_devido) || 0;
  const inss_devido = parseFloat(form.inss_devido) || 0;

  const total_devido = pis_devido + cofins_devido + irpj_devido + csll_devido + icms_devido + iss_devido + inss_devido;
  const total_pago = parseFloat(form.icms_pago || 0) + parseFloat(form.iss_pago || 0) + parseFloat(form.inss_pago || 0);
  const total_passivo = Math.max(0, total_devido - total_pago);

  const score = Math.min(100, Math.round(
    (total_passivo > 100000 ? 40 : total_passivo > 10000 ? 20 : 5) +
    (divergencia > 20 ? 30 : divergencia > 10 ? 15 : 0) +
    (divergencia > 0 ? 10 : 0)
  ));

  const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  const handleSalvar = async () => {
    setSalvando(true);
    const user = await base44.auth.me();
    const existentes = await base44.entities.PassivoTributario.filter({ empresa_id: empresa.id, periodo: form.periodo });
    const dados = {
      empresa_id: empresa.id,
      empresa_nome: empresa.nome,
      empresa_cnpj: empresa.cnpj,
      periodo: form.periodo,
      regime_tributario: empresa.regime_tributario,
      faturamento_nfe: fat,
      faturamento_declarado: decl,
      divergencia_percentual: divergencia,
      pis_devido, pis_pago: 0,
      cofins_devido, cofins_pago: 0,
      irpj_devido, irpj_pago: 0,
      csll_devido, csll_pago: 0,
      icms_devido, icms_pago: parseFloat(form.icms_pago) || 0,
      iss_devido, iss_pago: parseFloat(form.iss_pago) || 0,
      inss_devido, inss_pago: parseFloat(form.inss_pago) || 0,
      total_devido,
      total_pago,
      total_passivo,
      score_risco: score,
      calculado_em: new Date().toISOString(),
      calculado_por: user?.email || "sistema",
      observacoes: form.observacoes,
    };
    if (existentes.length > 0) {
      await base44.entities.PassivoTributario.update(existentes[0].id, dados);
    } else {
      await base44.entities.PassivoTributario.create(dados);
    }
    toast({ title: "✅ Passivo calculado e salvo!" });
    setSalvando(false);
    onSalvo();
  };

  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };
  const fmtRow = (label, value, color = "#A0B1D4") => (
    <div className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ color: "#6B7FA3" }}>{label}</span>
      <span className="font-semibold" style={{ color }}>{fmt(value)}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" style={{ color: "#0B5FFF" }} />
            <h2 className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Calcular Passivo — {empresa?.nome}
            </h2>
          </div>
          <button onClick={onClose} style={{ color: "#6B7FA3" }}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Entradas */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6B7FA3" }}>Dados do Período</h3>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Período (AAAA-MM) *</label>
              <input type="month" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Faturamento NF-e (R$)</label>
                <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                  value={form.faturamento_nfe} onChange={e => setForm(f => ({ ...f, faturamento_nfe: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Faturamento Declarado (R$)</label>
                <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                  value={form.faturamento_declarado} onChange={e => setForm(f => ({ ...f, faturamento_declarado: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>ICMS Devido (R$)</label>
                <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                  value={form.icms_devido} onChange={e => setForm(f => ({ ...f, icms_devido: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>ICMS Pago (R$)</label>
                <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                  value={form.icms_pago} onChange={e => setForm(f => ({ ...f, icms_pago: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>ISS Devido (R$)</label>
                <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                  value={form.iss_devido} onChange={e => setForm(f => ({ ...f, iss_devido: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>ISS Pago (R$)</label>
                <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                  value={form.iss_pago} onChange={e => setForm(f => ({ ...f, iss_pago: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>INSS Devido (R$)</label>
                <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                  value={form.inss_devido} onChange={e => setForm(f => ({ ...f, inss_devido: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>INSS Pago (R$)</label>
                <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                  value={form.inss_pago} onChange={e => setForm(f => ({ ...f, inss_pago: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Observações</label>
              <textarea rows={2} className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" style={inputStyle}
                value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
            </div>
          </div>

          {/* Preview do cálculo */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6B7FA3" }}>Resultado Calculado — {regime.replace("_", " ")}</h3>
            <div className="rounded-xl p-4 space-y-0.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {fmtRow("PIS Devido", pis_devido)}
              {fmtRow("COFINS Devido", cofins_devido)}
              {fmtRow("ICMS Devido", icms_devido)}
              {fmtRow("ISS Devido", iss_devido)}
              {fmtRow("IRPJ Devido", irpj_devido)}
              {fmtRow("CSLL Devido", csll_devido)}
              {fmtRow("INSS Devido", inss_devido)}
              <div className="pt-2 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                {fmtRow("Total Devido", total_devido, "#FF9F1C")}
                {fmtRow("Total Pago", total_pago, "#1E9B5B")}
              </div>
              <div className="pt-2 mt-2" style={{ borderTop: "2px solid rgba(230,57,70,0.3)" }}>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-bold" style={{ color: "#fff" }}>Passivo Total</span>
                  <span className="text-xl font-bold" style={{ color: "#E63946", fontFamily: "'Exo 2', sans-serif" }}>{fmt(total_passivo)}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: score >= 70 ? "rgba(230,57,70,0.08)" : score >= 40 ? "rgba(255,159,28,0.08)" : "rgba(30,155,91,0.08)", border: `1px solid ${score >= 70 ? "rgba(230,57,70,0.2)" : score >= 40 ? "rgba(255,159,28,0.2)" : "rgba(30,155,91,0.2)"}` }}>
              <span className="text-sm" style={{ color: "#A0B1D4" }}>Score de Risco</span>
              <span className="text-2xl font-bold" style={{ color: score >= 70 ? "#E63946" : score >= 40 ? "#FF9F1C" : "#1E9B5B", fontFamily: "'Exo 2', sans-serif" }}>
                {score}/100
              </span>
            </div>
            <div className="text-xs rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#6B7FA3" }}>
              Regime: <strong style={{ color: "#A0B1D4" }}>{regime.replace("_", " ")}</strong> · 
              Divergência: <strong style={{ color: divergencia > 10 ? "#E63946" : "#1E9B5B" }}>{divergencia.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="flex-1 text-sm font-medium py-2 rounded-xl"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}>
            Cancelar
          </button>
          <button onClick={handleSalvar} disabled={salvando}
            className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)" }}>
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
            {salvando ? "Calculando..." : "Calcular e Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}