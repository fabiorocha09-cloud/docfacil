import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const TRIBUTOS = ["PIS", "COFINS", "ICMS", "ISS", "IRPJ", "CSLL", "INSS", "FGTS", "OUTROS"];
const ORIGENS = ["certidao", "nfe", "dctf", "sped", "intimacao", "manual", "sefaz", "receita"];

export default function NovaPendenciaModal({ empresas, onClose, onSalvo }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    empresa_id: "",
    tipo_tributo: "PIS",
    descricao: "",
    origem: "manual",
    valor_principal: 0,
    valor_multa: 0,
    valor_juros: 0,
    periodo_referencia: new Date().toISOString().slice(0, 7),
    data_vencimento: "",
    criticidade: "medio",
    status: "aberta",
    observacoes: "",
  });
  const [salvando, setSalvando] = useState(false);

  const empresa = empresas.find(e => e.id === form.empresa_id);
  const valor_total = (parseFloat(form.valor_principal) || 0) + (parseFloat(form.valor_multa) || 0) + (parseFloat(form.valor_juros) || 0);

  const handleSalvar = async () => {
    if (!form.empresa_id) return;
    setSalvando(true);
    await base44.entities.PendenciaFiscal.create({
      ...form,
      empresa_nome: empresa?.nome,
      empresa_cnpj: empresa?.cnpj,
      valor_principal: parseFloat(form.valor_principal) || 0,
      valor_multa: parseFloat(form.valor_multa) || 0,
      valor_juros: parseFloat(form.valor_juros) || 0,
      valor_total,
      historico_status: [{ status: "aberta", data: new Date().toISOString(), usuario: "usuario" }],
    });
    toast({ title: "✅ Pendência criada com sucesso!" });
    setSalvando(false);
    onSalvo();
  };

  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="font-semibold text-white flex items-center gap-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
            <AlertTriangle className="w-4 h-4" style={{ color: "#FF9F1C" }} /> Nova Pendência Fiscal
          </h2>
          <button onClick={onClose} style={{ color: "#6B7FA3" }}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Empresa *</label>
            <select className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              value={form.empresa_id} onChange={e => setForm(f => ({ ...f, empresa_id: e.target.value }))}>
              <option value="" style={{ background: "#0A0D14" }}>— Selecione —</option>
              {empresas.map(e => <option key={e.id} value={e.id} style={{ background: "#0A0D14" }}>{e.nome}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Tipo de Tributo *</label>
              <select className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.tipo_tributo} onChange={e => setForm(f => ({ ...f, tipo_tributo: e.target.value }))}>
                {TRIBUTOS.map(t => <option key={t} value={t} style={{ background: "#0A0D14" }}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Origem</label>
              <select className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.origem} onChange={e => setForm(f => ({ ...f, origem: e.target.value }))}>
                {ORIGENS.map(o => <option key={o} value={o} style={{ background: "#0A0D14" }}>{o}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Descrição</label>
            <input className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Ex: ICMS não recolhido competência 2024-01" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Principal (R$)</label>
              <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.valor_principal} onChange={e => setForm(f => ({ ...f, valor_principal: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Multa (R$)</label>
              <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.valor_multa} onChange={e => setForm(f => ({ ...f, valor_multa: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Juros (R$)</label>
              <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.valor_juros} onChange={e => setForm(f => ({ ...f, valor_juros: e.target.value }))} />
            </div>
          </div>

          {valor_total > 0 && (
            <div className="text-xs px-3 py-2 rounded-xl flex items-center justify-between"
              style={{ background: "rgba(230,57,70,0.08)", border: "1px solid rgba(230,57,70,0.15)", color: "#E63946" }}>
              <span>Valor Total Calculado</span>
              <span className="font-bold text-sm">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor_total)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Período</label>
              <input type="month" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.periodo_referencia} onChange={e => setForm(f => ({ ...f, periodo_referencia: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Vencimento</label>
              <input type="date" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.data_vencimento} onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Criticidade</label>
              <select className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.criticidade} onChange={e => setForm(f => ({ ...f, criticidade: e.target.value }))}>
                <option value="alto" style={{ background: "#0A0D14" }}>🔴 Alto</option>
                <option value="medio" style={{ background: "#0A0D14" }}>🟡 Médio</option>
                <option value="baixo" style={{ background: "#0A0D14" }}>🟢 Baixo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Status Inicial</label>
              <select className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="aberta" style={{ background: "#0A0D14" }}>Aberta</option>
                <option value="em_negociacao" style={{ background: "#0A0D14" }}>Em Negociação</option>
                <option value="contestada" style={{ background: "#0A0D14" }}>Contestada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Observações</label>
            <textarea rows={2} className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" style={inputStyle}
              value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
          </div>
        </div>

        <div className="flex gap-3 p-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="flex-1 text-sm font-medium py-2 rounded-xl"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}>Cancelar</button>
          <button onClick={handleSalvar} disabled={salvando || !form.empresa_id}
            className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)" }}>
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {salvando ? "Salvando..." : "Criar Pendência"}
          </button>
        </div>
      </div>
    </div>
  );
}