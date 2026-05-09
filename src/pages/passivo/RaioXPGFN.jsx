import { useState } from "react";
import { AlertTriangle, Users, UserPlus } from "lucide-react";
import MonitoramentoClientes from "@/components/pgfn/MonitoramentoClientes";
import ConsultaNaoCliente from "@/components/pgfn/ConsultaNaoCliente";

export default function RaioXPGFN() {
  const [subAba, setSubAba] = useState("monitoramento");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          Raio-X PGFN — Lista de Devedores
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6B7FA3" }}>
          Consulta à Lista de Devedores da PGFN · Proposta de Regularização com até 70% de desconto
        </p>
      </div>

      {/* Banner informativo */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-xs"
        style={{ background: "rgba(11,95,255,0.06)", border: "1px solid rgba(11,95,255,0.2)", color: "#5E9BFF" }}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          A consulta utiliza o portal oficial da PGFN <strong>listadevedores.pgfn.gov.br</strong>. 
          Os dados são atualizados trimestralmente pela PGFN. Valores podem variar com juros e multas.
          <a href="https://www.listadevedores.pgfn.gov.br/" target="_blank" rel="noreferrer"
            className="ml-2 underline flex-shrink-0">
            Verificar manualmente →
          </a>
        </span>
      </div>

      {/* Sub-abas */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={() => setSubAba("monitoramento")}
          className="flex items-center gap-2 flex-1 justify-center text-xs font-medium px-3 py-2.5 rounded-lg transition-all"
          style={{
            background: subAba === "monitoramento" ? "rgba(11,95,255,0.2)" : "transparent",
            color: subAba === "monitoramento" ? "#5E9BFF" : "#6B7FA3",
            border: subAba === "monitoramento" ? "1px solid rgba(11,95,255,0.35)" : "1px solid transparent",
            fontFamily: "'Outfit', sans-serif",
          }}>
          <Users className="w-3.5 h-3.5" />
          Monitoramento — Clientes Scala
        </button>
        <button onClick={() => setSubAba("negociacao")}
          className="flex items-center gap-2 flex-1 justify-center text-xs font-medium px-3 py-2.5 rounded-lg transition-all"
          style={{
            background: subAba === "negociacao" ? "rgba(11,95,255,0.2)" : "transparent",
            color: subAba === "negociacao" ? "#5E9BFF" : "#6B7FA3",
            border: subAba === "negociacao" ? "1px solid rgba(11,95,255,0.35)" : "1px solid transparent",
            fontFamily: "'Outfit', sans-serif",
          }}>
          <UserPlus className="w-3.5 h-3.5" />
          Consulta de Negociações
        </button>
      </div>

      {/* Conteúdo */}
      {subAba === "monitoramento" && <MonitoramentoClientes />}
      {subAba === "negociacao" && <ConsultaNaoCliente />}
    </div>
  );
}