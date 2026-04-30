const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function HistoricoDebitos({ debitos }) {
  const sorted = [...debitos].sort((a, b) => (b.data_pagamento || "").localeCompare(a.data_pagamento || ""));

  if (sorted.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa", background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 14 }}>Nenhum pagamento registrado ainda.</div>
      </div>
    );
  }

  const totalPago = sorted.reduce((s, d) => s + (d.valor || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 16, padding: "12px 16px", background: "#eefaf3", borderRadius: 8, border: "1px solid #a3e4b9", display: "inline-block" }}>
        <span style={{ fontSize: 12, color: "#555" }}>Total pago registrado: </span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#1B7A3E" }}>{fmt(totalPago)}</span>
      </div>
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1B2A4A", color: "#fff" }}>
              <th style={{ padding: "10px", textAlign: "left", fontSize: 11, fontWeight: 700 }}>EMPRESA</th>
              <th style={{ padding: "10px", textAlign: "left", fontSize: 11, fontWeight: 700 }}>TRIBUTO</th>
              <th style={{ padding: "10px", textAlign: "left", fontSize: 11, fontWeight: 700 }}>COMPETÊNCIA</th>
              <th style={{ padding: "10px", textAlign: "left", fontSize: 11, fontWeight: 700 }}>MÊS REF.</th>
              <th style={{ padding: "10px", textAlign: "right", fontSize: 11, fontWeight: 700 }}>VALOR</th>
              <th style={{ padding: "10px", textAlign: "left", fontSize: 11, fontWeight: 700 }}>PAGO EM</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, i) => (
              <tr key={d.id} style={{ background: i % 2 === 0 ? "#fff" : "#f9faf9", borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "8px 10px", fontSize: 12, color: "#333" }}>{d.empresa_nome}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, fontWeight: 600, color: "#1B2A4A" }}>{d.tributo}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, color: "#555" }}>{d.competencia}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, color: "#555" }}>{d.mes_referencia}</td>
                <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 700, color: "#1B7A3E", textAlign: "right" }}>{fmt(d.valor)}</td>
                <td style={{ padding: "8px 10px", fontSize: 12, color: "#555" }}>
                  {d.data_pagamento ? new Date(d.data_pagamento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}