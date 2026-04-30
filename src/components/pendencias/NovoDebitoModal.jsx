import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2 } from "lucide-react";

const TRIBUTOS_SUGESTOES = [
  "IRRF", "INSS", "SIMPLES NACIONAL", "FGTS", "ISS", "ICMS", "PIS", "COFINS", "CSLL", "IRPJ", "OUTROS"
];

const ESFERAS = ["Federal", "Estadual", "Municipal"];

export default function NovoDebitoModal({ empresaNome, empresaCnpj, mesReferencia, onClose, onSalvo }) {
  const [form, setForm] = useState({
    empresa_nome: empresaNome || "",
    empresa_cnpj: empresaCnpj || "",
    esfera: "Federal",
    tributo: "",
    competencia: "",
    valor: "",
    observacao: "",
    mes_referencia: mesReferencia || "",
    status: "Em aberto",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const handleSalvar = async () => {
    if (!form.empresa_nome || !form.tributo || !form.competencia || !form.valor || !form.mes_referencia) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    setSalvando(true);
    setErro("");
    await base44.entities.DebitoFiscal.create({
      ...form,
      valor: parseFloat(String(form.valor).replace(",", ".")) || 0,
    });
    onSalvo();
  };

  const inp = { border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", background: "#fff" };
  const lbl = { display: "block", fontSize: 11, color: "#555", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#1B2A4A", borderRadius: "12px 12px 0 0" }}>
          <h2 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 700 }}>Novo Débito Fiscal</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8eafd4", cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Empresa *</label>
              <input style={inp} value={form.empresa_nome} onChange={e => setForm(f => ({ ...f, empresa_nome: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>CNPJ</label>
              <input style={inp} value={form.empresa_cnpj} onChange={e => setForm(f => ({ ...f, empresa_cnpj: e.target.value }))} placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <label style={lbl}>Mês de Referência *</label>
              <input style={inp} value={form.mes_referencia} onChange={e => setForm(f => ({ ...f, mes_referencia: e.target.value }))} placeholder="MM/AAAA" />
            </div>
            <div>
              <label style={lbl}>Esfera *</label>
              <select style={inp} value={form.esfera} onChange={e => setForm(f => ({ ...f, esfera: e.target.value }))}>
                {ESFERAS.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Tributo *</label>
              <input list="tributos-list" style={inp} value={form.tributo}
                onChange={e => setForm(f => ({ ...f, tributo: e.target.value }))} placeholder="Ex: IRRF, INSS..." />
              <datalist id="tributos-list">
                {TRIBUTOS_SUGESTOES.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div>
              <label style={lbl}>Competência *</label>
              <input style={inp} value={form.competencia} onChange={e => setForm(f => ({ ...f, competencia: e.target.value }))} placeholder="Ex: 02/2025" />
            </div>
            <div>
              <label style={lbl}>Valor (R$) *</label>
              <input type="number" step="0.01" style={inp} value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" />
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option>Em aberto</option>
                <option>Pago</option>
                <option>Parcelado</option>
                <option>Contestado</option>
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Observação</label>
              <textarea style={{ ...inp, height: 64, resize: "vertical" }} value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
            </div>
          </div>

          {erro && <div style={{ color: "#C0392B", fontSize: 12, fontWeight: 600 }}>{erro}</div>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
            <button onClick={handleSalvar} disabled={salvando}
              style={{ background: "#1B2A4A", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              {salvando ? <Loader2 size={14} className="animate-spin" /> : null}
              {salvando ? "Salvando..." : "Salvar Débito"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}