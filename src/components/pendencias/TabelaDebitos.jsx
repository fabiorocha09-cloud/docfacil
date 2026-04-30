import { useState } from "react";
import { Trash2, ChevronDown } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const STATUS_CORES = {
  "Em aberto": { bg: "#fff0ee", color: "#C0392B", border: "#f5c6c0" },
  "Pago":      { bg: "#eefaf3", color: "#1B7A3E", border: "#a3e4b9" },
  "Parcelado": { bg: "#eef2fa", color: "#1B2A4A", border: "#b3c3e0" },
  "Contestado":{ bg: "#fff8ee", color: "#e67e22", border: "#f5d8b0" },
};

const ESFERA_COR = {
  "Federal":   "#1B2A4A",
  "Estadual":  "#6d3e91",
  "Municipal": "#1a6b3c",
};

function StatusBadge({ status }) {
  const c = STATUS_CORES[status] || {};
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap"
    }}>{status}</span>
  );
}

function LinhaDebito({ debito, onPagar, onDesfazer, onAlterarStatus, onDeletar }) {
  const isPago = debito.status === "Pago";
  return (
    <tr style={{ background: isPago ? "#f9fdf9" : "#fff", borderBottom: "1px solid #e5e7eb" }}>
      <td style={{ padding: "8px 10px", fontSize: 12, color: ESFERA_COR[debito.esfera] || "#555", fontWeight: 600 }}>
        {debito.esfera}
      </td>
      <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 600, color: "#1B2A4A" }}>{debito.tributo}</td>
      <td style={{ padding: "8px 10px", fontSize: 12, color: "#555" }}>{debito.competencia}</td>
      <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 700, color: "#C0392B", textAlign: "right" }}>
        {fmt(debito.valor)}
      </td>
      <td style={{ padding: "8px 10px" }}>
        <StatusBadge status={debito.status} />
      </td>
      <td style={{ padding: "8px 10px", textAlign: "center" }}>
        <input
          type="checkbox"
          checked={isPago}
          onChange={() => isPago ? onDesfazer(debito.id) : onPagar(debito.id)}
          style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#1B7A3E" }}
        />
      </td>
      <td style={{ padding: "8px 10px" }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <select
            value={debito.status}
            onChange={e => onAlterarStatus(debito.id, e.target.value)}
            style={{ fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, padding: "3px 6px", background: "#fff", color: "#333" }}>
            <option value="Em aberto">Em aberto</option>
            <option value="Pago">Pago</option>
            <option value="Parcelado">Parcelado</option>
            <option value="Contestado">Contestado</option>
          </select>
          <button
            onClick={() => onDeletar(debito.id)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", padding: 2 }}
            title="Remover">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function TabelaDebitos({ debitos, onPagar, onDesfazer, onAlterarStatus, onDeletar }) {
  // Agrupar por tributo
  const grupos = {};
  debitos.forEach(d => {
    if (!grupos[d.tributo]) grupos[d.tributo] = [];
    grupos[d.tributo].push(d);
  });

  const totalGeral = debitos.reduce((s, d) => s + (d.valor || 0), 0);

  if (debitos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa", background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
        <div style={{ fontSize: 14 }}>Nenhum débito encontrado para este mês/empresa.</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#1B2A4A", color: "#fff" }}>
            <th style={{ padding: "10px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>ESFERA</th>
            <th style={{ padding: "10px 10px", textAlign: "left", fontSize: 11, fontWeight: 700 }}>TRIBUTO</th>
            <th style={{ padding: "10px 10px", textAlign: "left", fontSize: 11, fontWeight: 700 }}>COMPETÊNCIA</th>
            <th style={{ padding: "10px 10px", textAlign: "right", fontSize: 11, fontWeight: 700 }}>VALOR</th>
            <th style={{ padding: "10px 10px", textAlign: "left", fontSize: 11, fontWeight: 700 }}>STATUS</th>
            <th style={{ padding: "10px 10px", textAlign: "center", fontSize: 11, fontWeight: 700 }}>PAGO ✓</th>
            <th style={{ padding: "10px 10px", textAlign: "left", fontSize: 11, fontWeight: 700 }}>AÇÕES</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grupos).map(([tributo, items]) => {
            const subtotal = items.reduce((s, d) => s + (d.valor || 0), 0);
            return (
              <>
                {items.map(d => (
                  <LinhaDebito
                    key={d.id}
                    debito={d}
                    onPagar={onPagar}
                    onDesfazer={onDesfazer}
                    onAlterarStatus={onAlterarStatus}
                    onDeletar={onDeletar}
                  />
                ))}
                <tr key={`sub-${tributo}`} style={{ background: "#f0f4fa", borderBottom: "2px solid #d1daea" }}>
                  <td colSpan={3} style={{ padding: "7px 10px", fontSize: 12, fontWeight: 700, color: "#1B2A4A" }}>
                    Subtotal — {tributo}
                  </td>
                  <td style={{ padding: "7px 10px", fontSize: 13, fontWeight: 700, color: "#1B2A4A", textAlign: "right" }}>
                    {fmt(subtotal)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </>
            );
          })}
          {/* Total geral */}
          <tr style={{ background: "#C0392B" }}>
            <td colSpan={3} style={{ padding: "10px 10px", fontSize: 13, fontWeight: 700, color: "#fff" }}>
              TOTAL GERAL
            </td>
            <td style={{ padding: "10px 10px", fontSize: 15, fontWeight: 700, color: "#fff", textAlign: "right" }}>
              {fmt(totalGeral)}
            </td>
            <td colSpan={3} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}