import { Search, X } from "lucide-react";

export default function FiltrosPGFN({ filtros, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...filtros, [key]: value });
  };

  const temFiltrosAtivos = Object.values(filtros).some(v => v && v !== "");

  const limparFiltros = () => {
    onChange({ busca: "", situacao: "", faixaValor: "" });
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Busca por Empresa/CNPJ */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B7FA3" }}>Buscar</label>
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" style={{ color: "#6B7FA3" }} />
            <input
              type="text"
              value={filtros.busca || ""}
              onChange={(e) => handleChange("busca", e.target.value)}
              placeholder="Empresa ou CNPJ..."
              className="flex-1 rounded-lg px-2.5 py-2 text-xs focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
            />
          </div>
        </div>

        {/* Filtro por Situação */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B7FA3" }}>Situação PGFN</label>
          <select
            value={filtros.situacao || ""}
            onChange={(e) => handleChange("situacao", e.target.value)}
            className="w-full rounded-lg px-2.5 py-2 text-xs focus:outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
          >
            <option value="">Todas</option>
            <option value="devedor">⚠ Devedor</option>
            <option value="regular">✓ Regular</option>
            <option value="nao_consultado">◯ Não Consultado</option>
          </select>
        </div>

        {/* Filtro por Faixa de Valor */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B7FA3" }}>Faixa de Dívida</label>
          <select
            value={filtros.faixaValor || ""}
            onChange={(e) => handleChange("faixaValor", e.target.value)}
            className="w-full rounded-lg px-2.5 py-2 text-xs focus:outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
          >
            <option value="">Qualquer valor</option>
            <option value="ate_10k">Até R$ 10 mil</option>
            <option value="10k_50k">R$ 10 mil — R$ 50 mil</option>
            <option value="50k_100k">R$ 50 mil — R$ 100 mil</option>
            <option value="acima_100k">Acima de R$ 100 mil</option>
          </select>
        </div>

        {/* Botão Limpar */}
        {temFiltrosAtivos && (
          <div className="flex items-end">
            <button
              onClick={limparFiltros}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg"
              style={{ background: "rgba(230,57,70,0.12)", color: "#E63946", border: "1px solid rgba(230,57,70,0.25)" }}
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}