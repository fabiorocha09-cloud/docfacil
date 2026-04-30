import { useState } from "react";
import { X, FileText, Eye } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function GerarRelatorioModal({ debitos, empresaNome, empresaCnpj, mesReferencia, onClose }) {
  // Apenas Em aberto e Parcelado
  const debitosRelatorio = debitos.filter(d => d.status === "Em aberto" || d.status === "Parcelado");

  const grupos = {};
  debitosRelatorio.forEach(d => {
    if (!grupos[d.tributo]) grupos[d.tributo] = [];
    grupos[d.tributo].push(d);
  });

  const totalGeral = debitosRelatorio.reduce((s, d) => s + (d.valor || 0), 0);

  const handleImprimir = () => {
    const w = window.open("", "_blank");
    w.document.write(gerarHTML());
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  };

  const gerarHTML = () => {
    const linhasGrupos = Object.entries(grupos).map(([tributo, items]) => {
      const subtotal = items.reduce((s, d) => s + (d.valor || 0), 0);
      const linhas = items.map(d => `
        <tr>
          <td style="padding:6px 8px;font-size:12px;color:#444;">${d.esfera}</td>
          <td style="padding:6px 8px;font-size:12px;font-weight:600;color:#1B2A4A;">${d.tributo}</td>
          <td style="padding:6px 8px;font-size:12px;color:#555;">${d.competencia}</td>
          <td style="padding:6px 8px;font-size:12px;font-weight:700;color:#C0392B;text-align:right;">${fmt(d.valor)}</td>
          <td style="padding:6px 8px;font-size:11px;color:#888;">${d.status}</td>
        </tr>
      `).join("");
      return linhas + `
        <tr style="background:#f0f4fa;">
          <td colspan="3" style="padding:6px 8px;font-size:12px;font-weight:700;color:#1B2A4A;">Subtotal — ${tributo}</td>
          <td style="padding:6px 8px;font-size:12px;font-weight:700;color:#1B2A4A;text-align:right;">${fmt(subtotal)}</td>
          <td></td>
        </tr>
      `;
    }).join("");

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Fiscal — ${empresaNome}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #222; }
      h1 { color: #1B2A4A; font-size: 18px; margin-bottom: 2px; }
      .sub { color: #888; font-size: 13px; margin-bottom: 4px; }
      .header-box { border-left: 4px solid #1B2A4A; padding-left: 12px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      thead tr { background: #1B2A4A; color: #fff; }
      th { padding: 8px; font-size: 11px; text-align: left; }
      tr:nth-child(even) { background: #f9faf9; }
      .total-row td { background: #C0392B; color: #fff; font-weight: 700; font-size: 14px; padding: 10px 8px; }
      .legenda { margin-top: 32px; padding: 12px; background: #f5f6fa; border-radius: 6px; font-size: 11px; color: #888; }
      .rodape { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #e5e7eb; padding-top: 16px; }
      @media print { body { margin: 16px; } }
    </style></head><body>
    <div class="header-box">
      <div style="font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:1px;">RELATÓRIO FISCAL — COM VOCÊ SCALA LTDA</div>
      <h1>${empresaNome}</h1>
      <div class="sub">CNPJ: ${empresaCnpj} &nbsp;|&nbsp; Mês de Referência: ${mesReferencia}</div>
      <div class="sub" style="color:#C0392B;font-weight:600;">PENDÊNCIAS EM ABERTO E PARCELADAS</div>
    </div>
    <table>
      <thead><tr>
        <th>ESFERA</th><th>TRIBUTO</th><th>COMPETÊNCIA</th><th style="text-align:right">VALOR</th><th>STATUS</th>
      </tr></thead>
      <tbody>
        ${linhasGrupos}
        <tr class="total-row">
          <td colspan="3">TOTAL GERAL</td>
          <td style="text-align:right">${fmt(totalGeral)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
    <div class="legenda">
      <strong>LEGENDA E OBSERVAÇÕES</strong><br/>
      Os valores acima representam pendências fiscais identificadas até o mês de referência indicado.<br/>
      Débitos marcados como "Parcelado" possuem acordo de parcelamento vigente.
    </div>
    <div class="rodape">Documento elaborado por COM VOCÊ SCALA LTDA &nbsp;|&nbsp; ${new Date().toLocaleDateString("pt-BR")}</div>
    </body></html>`;
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 680, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#1B2A4A", borderRadius: "12px 12px 0 0" }}>
          <h2 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={18} /> Prévia do Relatório
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8eafd4", cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
          {/* Aviso */}
          <div style={{ background: "#fff8ee", border: "1px solid #f5d8b0", borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#7a5000" }}>
            <strong>⚠️ Prévia:</strong> Este relatório inclui apenas débitos com status <strong>Em aberto</strong> e <strong>Parcelado</strong>. Débitos pagos foram excluídos.
          </div>

          {/* Cabeçalho */}
          <div style={{ borderLeft: "4px solid #1B2A4A", paddingLeft: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>COM VOCÊ SCALA LTDA</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1B2A4A" }}>{empresaNome}</div>
            <div style={{ fontSize: 12, color: "#555" }}>CNPJ: {empresaCnpj} | Mês de Referência: {mesReferencia}</div>
          </div>

          {/* Tabela prévia */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#1B2A4A", color: "#fff" }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11 }}>ESFERA</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11 }}>TRIBUTO</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11 }}>COMPETÊNCIA</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 11 }}>VALOR</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(grupos).map(([tributo, items]) => {
                  const sub = items.reduce((s, d) => s + (d.valor || 0), 0);
                  return [
                    ...items.map(d => (
                      <tr key={d.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "6px 10px", fontSize: 12, color: "#555" }}>{d.esfera}</td>
                        <td style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#1B2A4A" }}>{d.tributo}</td>
                        <td style={{ padding: "6px 10px", fontSize: 12, color: "#555" }}>{d.competencia}</td>
                        <td style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#C0392B", textAlign: "right" }}>{fmt(d.valor)}</td>
                        <td style={{ padding: "6px 10px", fontSize: 11, color: "#888" }}>{d.status}</td>
                      </tr>
                    )),
                    <tr key={`sub-${tributo}`} style={{ background: "#f0f4fa" }}>
                      <td colSpan={3} style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#1B2A4A" }}>Subtotal — {tributo}</td>
                      <td style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#1B2A4A", textAlign: "right" }}>{fmt(sub)}</td>
                      <td />
                    </tr>
                  ];
                })}
                <tr style={{ background: "#C0392B" }}>
                  <td colSpan={3} style={{ padding: "10px", fontSize: 13, fontWeight: 700, color: "#fff" }}>TOTAL GERAL</td>
                  <td style={{ padding: "10px", fontSize: 14, fontWeight: 700, color: "#fff", textAlign: "right" }}>{fmt(totalGeral)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {debitosRelatorio.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: "#888" }}>Nenhum débito em aberto ou parcelado para incluir no relatório.</div>
          )}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13 }}>Fechar</button>
          <button onClick={handleImprimir}
            style={{ background: "#C0392B", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>
    </div>
  );
}