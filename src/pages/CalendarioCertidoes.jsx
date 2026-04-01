import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, AlertTriangle, Calendar } from "lucide-react";

const TIPOS_LABEL = {
  federal: "Federal", estadual: "Estadual", municipal: "Municipal",
  fgts: "FGTS", trabalhista: "Trabalhista",
  alvara_bombeiros: "Alvará - Bombeiros",
  alvara_vigilancia_sanitaria: "Alvará - Vigilância Sanitária",
  alvara_funcionamento: "Alvará - Funcionamento",
  alvara_meio_ambiente: "Alvará - Meio Ambiente",
};

const statusDot = { regular: "#22c55e", irregular: "#ef4444", pendente: "#fcd34d", processando: "#5E9BFF", erro: "#6B7FA3" };
const statusIcon = { regular: CheckCircle2, irregular: XCircle, pendente: Clock, processando: Clock, erro: AlertTriangle };

function getStatusEfetivo(cert) {
  if (cert.data_vencimento && new Date(cert.data_vencimento) < new Date()) return "irregular";
  return cert.status;
}

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };

export default function CalendarioCertidoes() {
  const [certidoes, setCertidoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoje] = useState(new Date());
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [periodoAlerta, setPeriodoAlerta] = useState(30);

  useEffect(() => {
    base44.entities.Certidao.list("-data_vencimento", 500).then(data => {
      setCertidoes(data.filter(c => !c.excluida && c.data_vencimento));
      setLoading(false);
    });
  }, []);

  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const nomeMes = new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const navMes = (delta) => {
    let nm = mes + delta, na = ano;
    if (nm < 0) { nm = 11; na--; }
    if (nm > 11) { nm = 0; na++; }
    setMes(nm); setAno(na); setDiaSelecionado(null);
  };

  const certidoesDoDia = (dia) => {
    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return certidoes.filter(c => c.data_vencimento === dataStr);
  };

  const certidoesSelecionadas = diaSelecionado ? certidoesDoDia(diaSelecionado) : [];

  const getDiff = (c) => Math.round((new Date(c.data_vencimento) - hoje) / (1000 * 60 * 60 * 24));
  const vencendo = (dias) => certidoes.filter(c => { const d = getDiff(c); return d >= 0 && d <= dias; });
  const vencidas = certidoes.filter(c => getDiff(c) < 0);

  const periodos = [
    { label: "7 dias",   dias: 7,  color: "#f87171",  bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)" },
    { label: "30 dias",  dias: 30, color: "#fb923c",  bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.25)" },
    { label: "60 dias",  dias: 60, color: "#fcd34d",  bg: "rgba(234,179,8,0.1)",   border: "rgba(234,179,8,0.25)" },
    { label: "90 dias",  dias: 90, color: "#4ade80",  bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)" },
  ];

  const summaryCards = [
    { label: "Vencidas",        value: vencidas.length,         color: "#f87171", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)" },
    { label: "Vencem em 7d",    value: vencendo(7).length,      color: "#fb923c", bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.25)" },
    { label: "Vencem em 30d",   value: vencendo(30).length,     color: "#fcd34d", bg: "rgba(234,179,8,0.1)",   border: "rgba(234,179,8,0.25)" },
    { label: "Vencem em 90d",   value: vencendo(90).length,     color: "#4ade80", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>Calendário de Vencimentos</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Visão mensal de todas as certidões por data de vencimento</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map(card => (
          <div key={card.label} className="rounded-2xl p-4" style={{ background: card.bg, border: `1px solid ${card.color}33` }}>
            <p className="text-2xl font-bold" style={{ color: card.color, fontFamily: "'Manrope', sans-serif" }}>{card.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendário */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={() => navMes(-1)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-white capitalize" style={{ fontFamily: "'Manrope', sans-serif" }}>{nomeMes}</h2>
            <button onClick={() => navMes(1)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
                <div key={d} className="text-center text-xs font-medium py-1" style={{ color: "#6B7FA3", fontFamily: "'Outfit', sans-serif" }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: diasNoMes }).map((_, i) => {
                const dia = i + 1;
                const certs = certidoesDoDia(dia);
                const isHoje = hoje.getDate() === dia && hoje.getMonth() === mes && hoje.getFullYear() === ano;
                const isSel = diaSelecionado === dia;
                const temIrregular = certs.some(c => getStatusEfetivo(c) === "irregular");
                const temPendente = certs.some(c => getStatusEfetivo(c) === "pendente");
                return (
                  <button key={dia} onClick={() => setDiaSelecionado(isSel ? null : dia)}
                    className="relative aspect-square flex flex-col items-center justify-start pt-1 rounded-xl text-sm transition-all"
                    style={{
                      background: isSel ? "#3A8DFF" : isHoje ? "rgba(58,141,255,0.15)" : "transparent",
                      color: isSel ? "#fff" : isHoje ? "#5E9BFF" : "#A0B1D4",
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: isHoje ? "700" : "400",
                    }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isHoje ? "rgba(58,141,255,0.15)" : "transparent"; }}>
                    <span>{dia}</span>
                    {certs.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                        {temIrregular && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSel ? "#fff" : "#ef4444" }} />}
                        {temPendente && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSel ? "#fff" : "#fcd34d" }} />}
                        {!temIrregular && !temPendente && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSel ? "#fff" : "#22c55e" }} />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-5 pb-4 flex items-center gap-4 text-xs" style={{ color: "#6B7FA3", fontFamily: "'Outfit', sans-serif" }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "#22c55e" }} /> Regular</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "#fcd34d" }} /> Pendente</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "#ef4444" }} /> Irregular/Vencida</span>
          </div>
        </div>

        {/* Painel lateral */}
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          {diaSelecionado ? (
            <>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  {diaSelecionado}/{String(mes + 1).padStart(2, "0")}/{ano}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{certidoesSelecionadas.length} certidão(ões)</p>
              </div>
              {certidoesSelecionadas.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Nenhuma certidão neste dia.</div>
              ) : (
                <div>
                  {certidoesSelecionadas.map(cert => {
                    const status = getStatusEfetivo(cert);
                    const cor = statusDot[status] || "#6B7FA3";
                    const Icon = statusIcon[status] || AlertTriangle;
                    return (
                      <div key={cert.id} className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: cor }} />
                          <div>
                            <p className="text-sm font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{cert.empresa_nome}</p>
                            <p className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{TIPOS_LABEL[cert.tipo]}{cert.subtipo ? ` — ${cert.subtipo}` : ""}</p>
                            <div className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-1.5 py-0.5 rounded-full"
                              style={{ color: cor, background: `${cor}22`, fontFamily: "'Outfit', sans-serif" }}>
                              <Icon className="w-3 h-3" />
                              <span className="capitalize">{status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "#A0B1D4" }} />
              <p className="text-sm" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Clique em um dia para ver as certidões que vencem</p>
            </div>
          )}
        </div>
      </div>

      {/* Visão Macro de Alertas */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>Visão Macro de Alertas</h3>
          <div className="flex items-center gap-2">
            {periodos.map(p => (
              <button key={p.dias} onClick={() => setPeriodoAlerta(p.dias)}
                className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                style={{
                  background: periodoAlerta === p.dias ? p.bg : "rgba(255,255,255,0.04)",
                  border: periodoAlerta === p.dias ? `1px solid ${p.border}` : "1px solid rgba(255,255,255,0.08)",
                  color: periodoAlerta === p.dias ? p.color : "#6B7FA3",
                  fontFamily: "'Outfit', sans-serif",
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="p-5 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}</div>
        ) : (() => {
          const lista = certidoes
            .filter(c => { const d = getDiff(c); return d >= 0 && d <= periodoAlerta; })
            .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));
          if (lista.length === 0) return (
            <div className="p-8 text-center text-sm" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Nenhuma certidão vencendo nos próximos {periodoAlerta} dias.</div>
          );
          return (
            <div>
              {lista.map(cert => {
                const diff = getDiff(cert);
                const urgColor = diff <= 7 ? "#f87171" : diff <= 30 ? "#fb923c" : diff <= 60 ? "#fcd34d" : "#4ade80";
                const urgBg    = diff <= 7 ? "rgba(239,68,68,0.12)" : diff <= 30 ? "rgba(251,146,60,0.12)" : diff <= 60 ? "rgba(234,179,8,0.12)" : "rgba(34,197,94,0.12)";
                const urgBorder= diff <= 7 ? "rgba(239,68,68,0.3)" : diff <= 30 ? "rgba(251,146,60,0.3)" : diff <= 60 ? "rgba(234,179,8,0.3)" : "rgba(34,197,94,0.3)";
                return (
                  <div key={cert.id} className="flex items-center justify-between px-5 py-3 transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate" style={{ fontFamily: "'Manrope', sans-serif" }}>{cert.empresa_nome}</p>
                      <p className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{TIPOS_LABEL[cert.tipo]}{cert.subtipo ? ` — ${cert.subtipo}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ background: urgBg, color: urgColor, border: `1px solid ${urgBorder}`, fontFamily: "'Outfit', sans-serif" }}>
                        {diff === 0 ? "Hoje" : `${diff}d`}
                      </span>
                      <span className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Outfit', sans-serif" }}>
                        {new Date(cert.data_vencimento).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}