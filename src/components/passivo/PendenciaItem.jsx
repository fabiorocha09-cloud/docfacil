import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const STATUS_CONFIG = {
  aberta: { label: "Aberta", color: "#E63946", bg: "rgba(230,57,70,0.12)", border: "rgba(230,57,70,0.25)" },
  em_negociacao: { label: "Em Negociação", color: "#FF9F1C", bg: "rgba(255,159,28,0.12)", border: "rgba(255,159,28,0.25)" },
  parcelada: { label: "Parcelada", color: "#0B5FFF", bg: "rgba(11,95,255,0.12)", border: "rgba(11,95,255,0.25)" },
  paga: { label: "Paga", color: "#1E9B5B", bg: "rgba(30,155,91,0.12)", border: "rgba(30,155,91,0.25)" },
  cancelada: { label: "Cancelada", color: "#6B7FA3", bg: "rgba(107,127,163,0.12)", border: "rgba(107,127,163,0.25)" },
  contestada: { label: "Contestada", color: "#9B59B6", bg: "rgba(155,89,182,0.12)", border: "rgba(155,89,182,0.25)" },
};

const CRIT_CONFIG = {
  alto: { color: "#E63946", label: "Alto" },
  medio: { color: "#FF9F1C", label: "Médio" },
  baixo: { color: "#1E9B5B", label: "Baixo" },
};

export default function PendenciaItem({ pendencia: p, onAtualizar }) {
  const [expandido, setExpandido] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const { toast } = useToast();

  const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.aberta;
  const critCfg = CRIT_CONFIG[p.criticidade] || CRIT_CONFIG.medio;

  const hoje = new Date();
  const diasVenc = p.data_vencimento ? Math.ceil((new Date(p.data_vencimento) - hoje) / 86400000) : null;

  const mudarStatus = async (novoStatus) => {
    setAtualizando(true);
    const hist = p.historico_status || [];
    await base44.entities.PendenciaFiscal.update(p.id, {
      status: novoStatus,
      historico_status: [...hist, { status: novoStatus, data: new Date().toISOString(), usuario: "sistema" }]
    });
    toast({ title: "✅ Status atualizado!" });
    setAtualizando(false);
    onAtualizar?.();
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setExpandido(v => !v)}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ background: critCfg.color }} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{p.tipo_tributo}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>
                {statusCfg.label}
              </span>
              {diasVenc !== null && diasVenc <= 30 && (
                <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(230,57,70,0.1)", color: "#E63946", border: "1px solid rgba(230,57,70,0.2)" }}>
                  <Clock className="w-3 h-3" /> {diasVenc}d
                </span>
              )}
            </div>
            <p className="text-xs truncate mt-0.5" style={{ color: "#6B7FA3" }}>{p.descricao || p.origem}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: "#E63946", fontFamily: "'Exo 2', sans-serif" }}>{fmt(p.valor_total)}</p>
            <p className="text-xs" style={{ color: "#6B7FA3" }}>{p.periodo_referencia || "—"}</p>
          </div>
          {expandido ? <ChevronUp className="w-4 h-4" style={{ color: "#6B7FA3" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#6B7FA3" }} />}
        </div>
      </div>

      {expandido && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="pt-3 grid grid-cols-3 gap-3 text-xs">
            <div>
              <p style={{ color: "#6B7FA3" }}>Principal</p>
              <p className="font-semibold text-white mt-0.5">{fmt(p.valor_principal)}</p>
            </div>
            <div>
              <p style={{ color: "#6B7FA3" }}>Multa</p>
              <p className="font-semibold text-white mt-0.5">{fmt(p.valor_multa)}</p>
            </div>
            <div>
              <p style={{ color: "#6B7FA3" }}>Juros</p>
              <p className="font-semibold text-white mt-0.5">{fmt(p.valor_juros)}</p>
            </div>
          </div>
          {p.data_vencimento && (
            <p className="text-xs" style={{ color: "#6B7FA3" }}>
              Vencimento: <span style={{ color: diasVenc !== null && diasVenc <= 7 ? "#E63946" : "#A0B1D4" }}>
                {new Date(p.data_vencimento).toLocaleDateString("pt-BR")}
                {diasVenc !== null && ` (${diasVenc >= 0 ? `${diasVenc}d restantes` : "vencida"})`}
              </span>
            </p>
          )}
          {p.observacoes && <p className="text-xs" style={{ color: "#6B7FA3" }}>Obs: {p.observacoes}</p>}
          {p.documento_referencia_url && (
            <a href={p.documento_referencia_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs" style={{ color: "#5E9BFF" }}>
              <ExternalLink className="w-3.5 h-3.5" /> Ver documento de referência
            </a>
          )}
          {/* Ações */}
          <div className="flex gap-2 flex-wrap pt-1">
            {p.status === "aberta" && (
              <>
                <button onClick={() => mudarStatus("em_negociacao")} disabled={atualizando}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(255,159,28,0.12)", color: "#FF9F1C", border: "1px solid rgba(255,159,28,0.25)" }}>
                  Em Negociação
                </button>
                <button onClick={() => mudarStatus("contestada")} disabled={atualizando}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(155,89,182,0.12)", color: "#9B59B6", border: "1px solid rgba(155,89,182,0.25)" }}>
                  Contestar
                </button>
              </>
            )}
            {(p.status === "aberta" || p.status === "em_negociacao" || p.status === "parcelada") && (
              <button onClick={() => mudarStatus("paga")} disabled={atualizando}
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(30,155,91,0.12)", color: "#1E9B5B", border: "1px solid rgba(30,155,91,0.25)" }}>
                <CheckCircle2 className="w-3 h-3 inline mr-1" />Marcar como Paga
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}