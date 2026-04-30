const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function ResumoCards({ debitos }) {
  const totalExigivel = debitos
    .filter(d => d.status !== "Pago")
    .reduce((s, d) => s + (d.valor || 0), 0);

  const totalPago = debitos
    .filter(d => d.status === "Pago")
    .reduce((s, d) => s + (d.valor || 0), 0);

  const saldo = totalExigivel;

  const qtdAberto = debitos.filter(d => d.status === "Em aberto").length;

  const cards = [
    { label: "Total Exigível", value: fmt(totalExigivel), color: "#C0392B", bg: "#fff0ee" },
    { label: "Total Pago no Mês", value: fmt(totalPago), color: "#1B7A3E", bg: "#eefaf3" },
    { label: "Saldo Remanescente", value: fmt(saldo), color: "#1B2A4A", bg: "#eef2fa" },
    { label: "Qtd. Débitos Em Aberto", value: qtdAberto, color: "#e67e22", bg: "#fff8ee" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: c.bg, border: `2px solid ${c.color}22`, borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>{c.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}