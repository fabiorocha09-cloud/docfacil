export default function FiltrosDebitos({ filtros, onChange, tributosDisponiveis }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>FILTROS:</span>
      <div>
        <label style={{ fontSize: 12, color: "#555", marginRight: 6 }}>Status:</label>
        <select
          value={filtros.status}
          onChange={e => onChange({ ...filtros, status: e.target.value })}
          style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "5px 10px", fontSize: 13, background: "#fff" }}>
          <option value="todos">Todos</option>
          <option value="Em aberto">Em aberto</option>
          <option value="Pago">Pago</option>
          <option value="Parcelado">Parcelado</option>
          <option value="Contestado">Contestado</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: 12, color: "#555", marginRight: 6 }}>Tributo:</label>
        <select
          value={filtros.tributo}
          onChange={e => onChange({ ...filtros, tributo: e.target.value })}
          style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "5px 10px", fontSize: 13, background: "#fff" }}>
          <option value="todos">Todos</option>
          {tributosDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  );
}