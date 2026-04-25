import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, X, Loader2, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const TRIBUTOS = ["PIS", "COFINS", "ICMS", "ISS", "IRPJ", "CSLL", "INSS", "FGTS", "TODOS"];
const REGIMES = ["simples_nacional", "lucro_presumido", "lucro_real", "mei", "todos"];
const ESTADOS = ["todos", "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const BASES = ["faturamento", "lucro_bruto", "lucro_liquido", "folha", "servicos"];

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };

function RegraModal({ regra, onClose, onSalvo }) {
  const { toast } = useToast();
  const [form, setForm] = useState(regra || {
    nome: "", tipo_tributo: "PIS", regime_tributario: "todos", estado: "todos",
    aliquota: 0, multa_percentual: 20, juro_diario: 0.033, prazo_prescricao_anos: 5,
    base_calculo: "faturamento", ativo: true, observacoes: "",
  });
  const [salvando, setSalvando] = useState(false);
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

  const handleSalvar = async () => {
    setSalvando(true);
    if (regra?.id) {
      await base44.entities.RegraTributariaPassivo.update(regra.id, form);
    } else {
      await base44.entities.RegraTributariaPassivo.create(form);
    }
    toast({ title: "✅ Regra salva com sucesso!" });
    setSalvando(false);
    onSalvo();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {regra ? "Editar Regra" : "Nova Regra Tributária"}
          </h2>
          <button onClick={onClose} style={{ color: "#6B7FA3" }}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Nome da Regra *</label>
            <input className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
              value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Tributo</label>
              <select className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.tipo_tributo} onChange={e => setForm(f => ({ ...f, tipo_tributo: e.target.value }))}>
                {TRIBUTOS.map(t => <option key={t} value={t} style={{ background: "#0A0D14" }}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Regime</label>
              <select className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.regime_tributario} onChange={e => setForm(f => ({ ...f, regime_tributario: e.target.value }))}>
                {REGIMES.map(r => <option key={r} value={r} style={{ background: "#0A0D14" }}>{r.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Estado (UF)</label>
              <select className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
                {ESTADOS.map(e => <option key={e} value={e} style={{ background: "#0A0D14" }}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Base de Cálculo</label>
              <select className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.base_calculo} onChange={e => setForm(f => ({ ...f, base_calculo: e.target.value }))}>
                {BASES.map(b => <option key={b} value={b} style={{ background: "#0A0D14" }}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Alíquota (%)</label>
              <input type="number" step="0.01" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.aliquota} onChange={e => setForm(f => ({ ...f, aliquota: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Multa (%)</label>
              <input type="number" step="0.01" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.multa_percentual} onChange={e => setForm(f => ({ ...f, multa_percentual: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Juro Diário (%)</label>
              <input type="number" step="0.001" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.juro_diario} onChange={e => setForm(f => ({ ...f, juro_diario: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#A0B1D4" }}>Prescrição (anos)</label>
              <input type="number" className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                value={form.prazo_prescricao_anos} onChange={e => setForm(f => ({ ...f, prazo_prescricao_anos: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => setForm(f => ({ ...f, ativo: !f.ativo }))}
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{ background: form.ativo ? "#0B5FFF" : "rgba(255,255,255,0.15)" }}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.ativo ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm" style={{ color: "#A0B1D4" }}>Regra ativa</span>
          </label>
        </div>
        <div className="flex gap-3 p-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="flex-1 text-sm font-medium py-2 rounded-xl"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A0B1D4" }}>Cancelar</button>
          <button onClick={handleSalvar} disabled={salvando || !form.nome}
            className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)" }}>
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {salvando ? "Salvando..." : "Salvar Regra"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracaoPassivo() {
  const [regras, setRegras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const { toast } = useToast();

  const carregar = async () => {
    setLoading(true);
    const r = await base44.entities.RegraTributariaPassivo.list();
    setRegras(r);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const deletar = async (id) => {
    if (!confirm("Excluir esta regra?")) return;
    await base44.entities.RegraTributariaPassivo.delete(id);
    toast({ title: "🗑️ Regra excluída." });
    carregar();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>Configurações Fiscais</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3" }}>Gerencie regras tributárias e parâmetros de cálculo</p>
        </div>
        <button onClick={() => { setEditando(null); setModalOpen(true); }}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
          style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)" }}>
          <Plus className="w-4 h-4" /> Nova Regra
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Settings className="w-4 h-4" style={{ color: "#6B7FA3" }} />
          <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>Regras Tributárias</h3>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}
          </div>
        ) : regras.length === 0 ? (
          <div className="p-12 text-center">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "#A0B1D4" }} />
            <p className="text-sm" style={{ color: "#6B7FA3" }}>Nenhuma regra configurada. Crie a primeira regra tributária.</p>
          </div>
        ) : (
          <div>
            {regras.map(r => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3.5 transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{r.nome}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: r.ativo ? "rgba(30,155,91,0.12)" : "rgba(255,255,255,0.05)", color: r.ativo ? "#1E9B5B" : "#6B7FA3", border: `1px solid ${r.ativo ? "rgba(30,155,91,0.2)" : "rgba(255,255,255,0.08)"}` }}>
                      {r.ativo ? "Ativa" : "Inativa"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(11,95,255,0.1)", color: "#5E9BFF", border: "1px solid rgba(11,95,255,0.2)" }}>
                      {r.tipo_tributo}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7FA3" }}>
                    Alíq. {r.aliquota}% · Multa {r.multa_percentual}% · Juro {r.juro_diario}%/dia · Prescrição {r.prazo_prescricao_anos}a
                    {r.estado !== "todos" && ` · ${r.estado}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditando(r); setModalOpen(true); }}
                    className="p-1.5 rounded-lg" style={{ color: "#6B7FA3" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#5E9BFF"}
                    onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deletar(r.id)}
                    className="p-1.5 rounded-lg" style={{ color: "#6B7FA3" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#E63946"}
                    onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <RegraModal regra={editando} onClose={() => setModalOpen(false)} onSalvo={() => { setModalOpen(false); carregar(); }} />
      )}
    </div>
  );
}